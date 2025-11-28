import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertCircle, Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageGallerySection } from "@/components/ai-art/ImageGallerySection";

const IMAGE_COST = 1;

export default function GenerateImagePage() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"text-to-image" | "image-to-image">("text-to-image");
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1024x1024");
  const [outputFormat, setOutputFormat] = useState("png");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");

  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { isOwner } = useUserRole();

  const hasUnlimitedCredits = isOwner;
  const hasInsufficientCredits = !hasUnlimitedCredits && !creditsLoading && (credits?.balance || 0) < IMAGE_COST;

  const handleModeChange = (newMode: "text-to-image" | "image-to-image") => {
    setMode(newMode);
    if (newMode === "text-to-image") {
      setInputImages([]);
      setAspectRatio("1:1");
    } else {
      setAspectRatio("auto");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const filePath = `${crypto.randomUUID()}-${file.name}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from("user-uploads")
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Failed to upload image");
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("user-uploads")
        .getPublicUrl(filePath);

      setInputImages(prev => [...prev, publicUrl]);
    }
  };

  const handleAddUrl = () => {
    if (imageUrl && imageUrl.startsWith("http")) {
      setInputImages(prev => [...prev, imageUrl]);
      setImageUrl("");
    } else {
      toast.error("Please enter a valid image URL");
    }
  };

  const handleRemoveImage = (index: number) => {
    setInputImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (mode === "image-to-image" && inputImages.length === 0) {
      toast.error("Please upload at least one image for image-to-image mode");
      return;
    }

    if (hasInsufficientCredits) {
      toast.error("Insufficient credits. Please purchase more credits to continue.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const title = `${mode === "text-to-image" ? "Text to Image" : "Image to Image"} - ${new Date().toLocaleString()}`;

      const { data: content, error: insertError } = await supabase
        .from("ai_art_content")
        .insert({
          user_id: user.id,
          type: "image",
          title,
          prompt,
          status: "generating",
          metadata: {
            mode,
            aspectRatio,
            resolution,
            outputFormat,
            ...(mode === "image-to-image" && { inputImages }),
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: functionError } = await supabase.functions.invoke("ai-social-generate", {
        body: {
          contentId: content.id,
          type: "image",
          mode,
          prompt,
          aspectRatio,
          resolution,
          outputFormat,
          ...(mode === "image-to-image" && { imageUrls: inputImages }),
        },
      });

      if (functionError) throw functionError;

      toast.success("Image generation started! Check the gallery below for results.");
      setPrompt("");
      setInputImages([]);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to start image generation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="glass-panel p-6 space-y-6">
              <h2 className="text-2xl font-semibold">Image Settings</h2>

              {hasInsufficientCredits && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You don't have enough credits. Each image costs {IMAGE_COST} credit.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={mode} onValueChange={(value: any) => handleModeChange(value)}>
                  <SelectTrigger>
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
                    <Label>Upload Images</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Or Add Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <Button onClick={handleAddUrl} variant="outline">
                        Add
                      </Button>
                    </div>
                  </div>

                  {inputImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {inputImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Input ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mode === "image-to-image" && <SelectItem value="auto">Auto</SelectItem>}
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="16:9">16:9</SelectItem>
                      <SelectItem value="9:16">9:16</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="3:4">3:4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="512x512">512x512</SelectItem>
                      <SelectItem value="1024x1024">1024x1024</SelectItem>
                      <SelectItem value="1920x1080">1920x1080</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Output Format</Label>
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

              <Button
                onClick={handleGenerate}
                disabled={isLoading || hasInsufficientCredits}
                className="w-full"
              >
                {isLoading ? "Generating..." : hasInsufficientCredits ? `Need ${IMAGE_COST} Credit` : "Generate Image"}
              </Button>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-2xl font-semibold mb-4">Preview</h2>
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Generated image will appear here</p>
            </div>
          </div>
        </div>

        <ImageGallerySection />
      </div>
    </DashboardLayout>
  );
}
