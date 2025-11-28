import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertCircle, Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoGallerySection } from "@/components/ai-art/VideoGallerySection";

const VIDEO_COST = 10;

export default function GenerateVideoPage() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"text-to-video" | "image-to-video" | "first-last-frame" | "reference-to-video">("text-to-video");
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [firstFrameImage, setFirstFrameImage] = useState<string>("");
  const [lastFrameImage, setLastFrameImage] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [duration, setDuration] = useState("4s");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");

  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { isOwner } = useUserRole();

  const hasUnlimitedCredits = isOwner;
  const hasInsufficientCredits = !hasUnlimitedCredits && !creditsLoading && (credits?.balance || 0) < VIDEO_COST;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const filePath = `${crypto.randomUUID()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
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

  const handleFirstFrameUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const filePath = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("user-uploads")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload first frame");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("user-uploads")
      .getPublicUrl(filePath);

    setFirstFrameImage(publicUrl);
  };

  const handleLastFrameUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const filePath = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("user-uploads")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload last frame");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("user-uploads")
      .getPublicUrl(filePath);

    setLastFrameImage(publicUrl);
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

    if (mode === "image-to-video" && inputImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    if (mode === "first-last-frame" && (!firstFrameImage || !lastFrameImage)) {
      toast.error("Please upload both first and last frame images");
      return;
    }

    if (mode === "reference-to-video" && inputImages.length === 0) {
      toast.error("Please upload a reference image");
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

      const modeTitle = mode === "text-to-video" ? "Text to Video" 
        : mode === "image-to-video" ? "Image to Video"
        : mode === "first-last-frame" ? "First/Last Frame to Video"
        : "Reference to Video";

      const title = `${modeTitle} - ${new Date().toLocaleString()}`;

      const { data: content, error: insertError } = await supabase
        .from("ai_art_content")
        .insert({
          user_id: user.id,
          type: "video",
          title,
          prompt,
          status: "generating",
          metadata: {
            mode,
            aspectRatio,
            resolution,
            duration: mode === "reference-to-video" ? "8s" : duration,
            generateAudio,
            ...(mode === "image-to-video" && { inputImages }),
            ...(mode === "first-last-frame" && { firstFrameImage, lastFrameImage }),
            ...(mode === "reference-to-video" && { referenceImage: inputImages[0] }),
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const requestBody: any = {
        contentId: content.id,
        type: "video",
        mode,
        prompt,
        aspectRatio,
        resolution,
        duration: mode === "reference-to-video" ? "8s" : duration,
        generateAudio,
      };

      if (mode === "image-to-video") {
        requestBody.imageUrls = inputImages;
      } else if (mode === "first-last-frame") {
        requestBody.firstFrameUrl = firstFrameImage;
        requestBody.lastFrameUrl = lastFrameImage;
      } else if (mode === "reference-to-video") {
        requestBody.referenceImageUrl = inputImages[0];
      }

      const { error: functionError } = await supabase.functions.invoke("ai-social-generate", {
        body: requestBody,
      });

      if (functionError) throw functionError;

      toast.success("Video generation started! Check the gallery below for results.");
      setPrompt("");
      setInputImages([]);
      setFirstFrameImage("");
      setLastFrameImage("");
      setGeneratedVideo(null);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to start video generation");
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
              <h2 className="text-2xl font-semibold">Video Settings</h2>

              {hasInsufficientCredits && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You don't have enough credits. Each video costs {VIDEO_COST} credits.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={mode} onValueChange={(value: any) => setMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-to-video">Text to Video</SelectItem>
                    <SelectItem value="image-to-video">Image to Video</SelectItem>
                    <SelectItem value="first-last-frame">First/Last Frame to Video</SelectItem>
                    <SelectItem value="reference-to-video">Reference to Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === "image-to-video" && (
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

              {mode === "first-last-frame" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>First Frame</Label>
                    <input
                      ref={firstFrameInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFirstFrameUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => firstFrameInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload First Frame
                    </Button>
                    {firstFrameImage && (
                      <img src={firstFrameImage} alt="First frame" className="w-full h-32 object-cover rounded-lg" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Last Frame</Label>
                    <input
                      ref={lastFrameInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLastFrameUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => lastFrameInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Last Frame
                    </Button>
                    {lastFrameImage && (
                      <img src={lastFrameImage} alt="Last frame" className="w-full h-32 object-cover rounded-lg" />
                    )}
                  </div>
                </div>
              )}

              {mode === "reference-to-video" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Reference Image</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
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
                      Upload Reference Image
                    </Button>
                  </div>

                  {inputImages.length > 0 && (
                    <div className="relative group">
                      <img
                        src={inputImages[0]}
                        alt="Reference"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setInputImages([])}
                        className="absolute top-2 right-2 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to create..."
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
                      <SelectItem value="16:9">16:9</SelectItem>
                      <SelectItem value="9:16">9:16</SelectItem>
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
                      <SelectItem value="720p">720p</SelectItem>
                      <SelectItem value="1080p">1080p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mode !== "reference-to-video" && (
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4s">4 seconds</SelectItem>
                      <SelectItem value="6s">6 seconds</SelectItem>
                      <SelectItem value="8s">8 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="generate-audio">Generate Audio</Label>
                <Switch
                  id="generate-audio"
                  checked={generateAudio}
                  onCheckedChange={setGenerateAudio}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || hasInsufficientCredits}
                className="w-full"
              >
                {isLoading ? "Generating..." : hasInsufficientCredits ? `Need ${VIDEO_COST} Credits` : "Generate Video"}
              </Button>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-2xl font-semibold mb-4">Preview</h2>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              {generatedVideo ? (
                <video src={generatedVideo} controls className="w-full h-full rounded-lg" />
              ) : (
                <p className="text-muted-foreground">Generated video will appear here</p>
              )}
            </div>
          </div>
        </div>

        <VideoGallerySection />
      </div>
    </DashboardLayout>
  );
}
