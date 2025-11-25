import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { VideoGallerySection } from "@/components/ai-social/VideoGallerySection";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const VIDEO_COST = 10; // €10 per video

export default function GenerateVideo() {
  const navigate = useNavigate();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text-to-video");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [duration, setDuration] = useState("6s");
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [firstFrameImage, setFirstFrameImage] = useState<string>("");
  const [lastFrameImage, setLastFrameImage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);

  const hasInsufficientCredits = !creditsLoading && (credits?.balance || 0) < VIDEO_COST;

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

  const handleFirstFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFirstFrameImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    if (firstFrameInputRef.current) {
      firstFrameInputRef.current.value = "";
    }
  };

  const handleLastFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLastFrameImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    if (lastFrameInputRef.current) {
      lastFrameInputRef.current.value = "";
    }
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

    if (mode === "image-to-video" && inputImages.length === 0) {
      toast.error("Please upload at least one input image for image-to-video mode");
      return;
    }

    if (mode === "reference-to-video" && inputImages.length === 0) {
      toast.error("Please upload at least one reference image for reference-to-video mode");
      return;
    }

    if (mode === "first-last-frame" && (!firstFrameImage || !lastFrameImage)) {
      toast.error("Please upload both first and last frame images for first/last frame mode");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const modeNames: Record<string, string> = {
        "text-to-video": "Text to Video",
        "image-to-video": "Image to Video",
        "reference-to-video": "Reference to Video",
        "first-last-frame": "First/Last Frame to Video"
      };

      const { data: content, error: createError } = await supabase
        .from("ai_social_content")
        .insert({
          user_id: user.id,
          type: "video",
          prompt,
          status: "pending",
          title: `${modeNames[mode] || mode} ${new Date().toLocaleString()}`
        } as any)
        .select()
        .single();

      if (createError) throw createError;

      // Call edge function to start generation (non-blocking)
      const { data: invokeData, error: invokeError } = await supabase.functions.invoke("ai-social-generate", {
        body: {
          contentId: content.id,
          type: "video",
          prompt,
          mode,
          inputImages: (mode === "image-to-video" || mode === "reference-to-video") ? inputImages : undefined,
          firstFrameImage: mode === "first-last-frame" ? firstFrameImage : undefined,
          lastFrameImage: mode === "first-last-frame" ? lastFrameImage : undefined,
          aspectRatio,
          resolution,
          duration: mode === "reference-to-video" ? "8s" : duration,
          generateAudio
        }
      });

      if (invokeError) {
        console.error("Error starting video generation:", invokeError);
        // Check if it's a credit error
        if (invokeError.message?.includes("Crediti insufficienti") || invokeData?.error?.includes("Crediti insufficienti")) {
          toast.error(invokeData?.error || "Crediti insufficienti. Acquista crediti nel Wallet.");
          // Delete the pending content record
          await supabase.from("ai_social_content").delete().eq("id", content.id);
          return;
        }
        toast.error(invokeData?.error || "Failed to start video generation");
        return;
      }

      if (invokeData?.error) {
        toast.error(invokeData.error);
        await supabase.from("ai_social_content").delete().eq("id", content.id);
        return;
      }

      toast.success("Video generation started (€10 deducted)! You can navigate away, it will continue in background.");
      
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error("Failed to start video generation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Generate Video</h1>
          <p className="text-muted-foreground mt-2">
            Create videos with AI using Veo3
          </p>
        </div>

        {hasInsufficientCredits && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Crediti insufficienti</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Hai bisogno di almeno €{VIDEO_COST} per generare un video.</span>
              <Button variant="outline" size="sm" onClick={() => navigate("/wallet")}>
                Vai al Wallet
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
              <CardDescription>Configure your AI-generated video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mode">Generation Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-to-video">Text to Video</SelectItem>
                    <SelectItem value="image-to-video">Image to Video</SelectItem>
                    <SelectItem value="reference-to-video">Reference to Video</SelectItem>
                    <SelectItem value="first-last-frame">First/Last Frame to Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === "first-last-frame" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-frame">First Frame</Label>
                      <Input
                        id="first-frame"
                        ref={firstFrameInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFirstFrameUpload}
                      />
                      {firstFrameImage && (
                        <div className="relative group">
                          <img 
                            src={firstFrameImage} 
                            alt="First frame"
                            className="w-full rounded-lg aspect-video object-cover"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setFirstFrameImage("")}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last-frame">Last Frame</Label>
                      <Input
                        id="last-frame"
                        ref={lastFrameInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLastFrameUpload}
                      />
                      {lastFrameImage && (
                        <div className="relative group">
                          <img 
                            src={lastFrameImage} 
                            alt="Last frame"
                            className="w-full rounded-lg aspect-video object-cover"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setLastFrameImage("")}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Upload two images: the first and last frame of your desired video. AI will generate the content in between.
                  </p>
                </div>
              )}

              {(mode === "image-to-video" || mode === "reference-to-video") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-image">
                      {mode === "reference-to-video" ? "Upload Reference Images" : "Upload Images"}
                    </Label>
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
                              className="w-full rounded-lg aspect-video object-cover"
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

                  <p className="text-xs text-muted-foreground">
                    {mode === "reference-to-video" 
                      ? "Upload images that show the subject you want to appear consistently in the video"
                      : "Image should be 720p or higher in 16:9 or 9:16 aspect ratio"}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the video you want to generate (be descriptive: subject, action, style, camera motion)..."
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {mode !== "reference-to-video" && (
                  <div className="space-y-2">
                    <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger id="aspectRatio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger id="resolution">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p</SelectItem>
                      <SelectItem value="1080p">1080p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={setDuration} disabled={mode === "reference-to-video"}>
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mode === "reference-to-video" ? (
                        <SelectItem value="8s">8 seconds</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="4s">4 seconds</SelectItem>
                          <SelectItem value="6s">6 seconds</SelectItem>
                          <SelectItem value="8s">8 seconds</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="generate-audio">Generate Audio</Label>
                  <p className="text-xs text-muted-foreground">
                    Disable to save 50% credits
                  </p>
                </div>
                <Switch
                  id="generate-audio"
                  checked={generateAudio}
                  onCheckedChange={setGenerateAudio}
                />
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
                  `Generate Video (€${VIDEO_COST})`
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Generated video will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedVideo ? (
                <video 
                  src={generatedVideo} 
                  controls 
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <p className="text-muted-foreground">No video generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <VideoGallerySection />
      </div>
    </DashboardLayout>
  );
}
