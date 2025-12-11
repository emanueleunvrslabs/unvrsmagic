import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { ImageGallerySection } from "@/components/ai-art/ImageGallerySection";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import "@/components/labs/SocialMediaCard.css";

const IMAGE_COST = 1; // €1 per image

export default function GenerateImage() {
  const navigate = useNavigate();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { isOwner, isAdmin } = useUserRole();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"text-to-image" | "image-to-image">("text-to-image");
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Owner and admin have unlimited credits
  const hasUnlimitedCredits = isOwner || isAdmin;
  const hasInsufficientCredits = !hasUnlimitedCredits && !creditsLoading && (credits?.balance || 0) < IMAGE_COST;

  // Update aspect ratio to "auto" when switching to image-to-image
  const handleModeChange = (newMode: "text-to-image" | "image-to-image") => {
    setMode(newMode);
    if (newMode === "image-to-image") {
      setAspectRatio("auto");
    } else {
      setAspectRatio("1:1");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input after reading
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddUrl = () => {
    if (imageUrl.trim()) {
      setInputImages(prev => [...prev, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setInputImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    // Check credits first
    if (hasInsufficientCredits) {
      toast.error("Crediti insufficienti. Vai al Wallet per acquistare crediti.");
      return;
    }

    if (!prompt) {
      toast.error("Please enter a prompt");
      return;
    }

    if (mode === "image-to-image" && inputImages.length === 0) {
      toast.error("Please upload at least one input image or add an image URL");
      return;
    }

    setLoading(true);
    try {
      // Create content record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: content, error: createError } = await supabase
        .from("ai_art_content")
        .insert({
          user_id: user.id,
          type: "image",
          prompt,
          status: "pending",
          title: mode === "text-to-image" ? "Text to Image" : "Image to Image"
        })
        .select()
        .single();

      if (createError) throw createError;

      // Call edge function to start generation (non-blocking)
      const { data: invokeData, error: invokeError } = await supabase.functions.invoke("ai-art-generate", {
        body: {
          contentId: content.id,
          type: "image",
          prompt,
          mode,
          inputImages: mode === "image-to-image" ? inputImages : undefined,
          aspectRatio,
          resolution,
          outputFormat
        }
      });

      if (invokeError) {
        console.error("Error starting image generation:", invokeError);
        // Check if it's a credit error
        if (invokeError.message?.includes("Crediti insufficienti") || invokeData?.error?.includes("Crediti insufficienti")) {
          toast.error(invokeData?.error || "Crediti insufficienti. Acquista crediti nel Wallet.");
          // Delete the pending content record
          await supabase.from("ai_art_content").delete().eq("id", content.id);
          return;
        }
        toast.error(invokeData?.error || "Failed to start image generation");
        return;
      }

      if (invokeData?.error) {
        toast.error(invokeData.error);
        await supabase.from("ai_art_content").delete().eq("id", content.id);
        return;
      }

      toast.success("Image generation started (€1 deducted)! You can navigate away, it will continue in background.");
      
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to start image generation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Generate Image</h1>
          <p className="text-muted-foreground mt-2">
            Create images with AI using Nano Banana
          </p>
        </div>

        {hasInsufficientCredits && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Insufficient Credits</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>You need at least €{IMAGE_COST} to generate an image.</span>
              <Button variant="outline" size="sm" onClick={() => navigate("/wallet")}>
                Go to Wallet
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="labs-client-card rounded-[22px] p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Image Settings</h3>
              <p className="text-sm text-white/50 mt-1">Configure your AI-generated image</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mode">Generation Mode</Label>
                <Select value={mode} onValueChange={(value) => handleModeChange(value as "text-to-image" | "image-to-image")}>
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-to-image">Text to Image</SelectItem>
                    <SelectItem value="image-to-image">Image to Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === "image-to-image" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-image">Upload Images</Label>
                    <Input
                      id="input-image"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-url">Add Image from URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image-url"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddUrl();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddUrl}
                        disabled={!imageUrl.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {inputImages.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Images ({inputImages.length})</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {inputImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={img} 
                              alt={`Input ${index + 1}`}
                              className="w-full rounded-lg aspect-square object-cover"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder={mode === "text-to-image" 
                    ? "Describe the image you want to generate..." 
                    : "Describe how you want to modify the image..."}
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mode === "image-to-image" && <SelectItem value="auto">Auto</SelectItem>}
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="3:4">3:4</SelectItem>
                      <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                      <SelectItem value="3:2">3:2</SelectItem>
                      <SelectItem value="2:3">2:3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1K">1K</SelectItem>
                      <SelectItem value="2K">2K</SelectItem>
                      <SelectItem value="4K">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="output-format">Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="webp">WEBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading || hasInsufficientCredits}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : hasInsufficientCredits ? (
                  "Crediti insufficienti"
                ) : (
                  `Generate Image (€${IMAGE_COST})`
                )}
              </Button>
            </div>
          </div>

          <div className="labs-client-card rounded-[22px] p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Preview</h3>
              <p className="text-sm text-white/50 mt-1">Generated image will appear here</p>
            </div>
            
            <div className="w-full">
              {generatedImage ? (
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-64 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/40">No image generated yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ImageGallerySection />
      </div>
    </DashboardLayout>
  );
}
