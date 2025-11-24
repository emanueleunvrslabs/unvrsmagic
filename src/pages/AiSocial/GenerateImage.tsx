import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, Share2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type GenerationMode = "text-to-image" | "image-to-image";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export default function GenerateImage() {
  const [mode, setMode] = useState<GenerationMode>("text-to-image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);

  const aspectRatioOptions = [
    { value: "1:1", label: "1:1 Square" },
    { value: "16:9", label: "16:9 Wide" },
    { value: "9:16", label: "9:16 Portrait" },
    { value: "4:3", label: "4:3 Classic" },
    { value: "3:4", label: "3:4 Tall" },
  ];

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("Please enter a description");
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: content, error: createError } = await supabase
        .from("ai_social_content")
        .insert({
          user_id: user.id,
          type: "image",
          prompt,
          status: "pending",
          title: prompt.substring(0, 50)
        } as any)
        .select()
        .single();

      if (createError) throw createError;

      const { data, error } = await supabase.functions.invoke("ai-social-generate", {
        body: {
          contentId: content.id,
          type: "image",
          prompt: `${prompt} (aspect ratio: ${aspectRatio})`
        }
      });

      if (error) throw error;

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      setGeneratedImage(data.mediaUrl);
      setGenerationTime(duration);
      setCost(0.05); // Mock cost
      toast.success("Image generated successfully!");
      
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex gap-4 p-4 min-h-screen">
        {/* Left Panel - Controls */}
        <div className="w-[480px] flex flex-col gap-4 bg-card border rounded-xl p-4 h-fit sticky top-4">
          {/* Generation Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Generation Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={mode === "text-to-image" ? "default" : "outline"}
                onClick={() => setMode("text-to-image")}
                className="h-10"
              >
                Text to Image
              </Button>
              <Button
                variant={mode === "image-to-image" ? "default" : "outline"}
                onClick={() => setMode("image-to-image")}
                className="h-10"
              >
                Image to Image
              </Button>
            </div>
          </div>

          {/* Reference Images */}
          {mode === "image-to-image" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reference Images</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-24 border-dashed flex flex-col gap-2"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2 bg-primary/10"
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-xs text-primary font-medium">Generate Model</span>
                </Button>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Description</Label>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Boost
              </Button>
            </div>
            <Textarea
              placeholder="Describe how to transform the reference images..."
              className="min-h-[160px] resize-none bg-background"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Format</Label>
            <div className="flex gap-2 flex-wrap">
              {aspectRatioOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={aspectRatio === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAspectRatio(option.value as AspectRatio)}
                  className="flex-1 min-w-[90px] h-8 text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="lg"
            className="w-full h-11 text-sm gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Image with Nano 🦀
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-card border rounded-xl overflow-hidden relative">
            {generatedImage ? (
              <>
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-cover"
                />
                {generationTime !== null && (
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                    <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium">
                      {generationTime.toFixed(2)}s
                    </div>
                    {cost !== null && (
                      <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-primary">
                        ${cost.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">No Image Generated</h3>
                    <p className="text-muted-foreground">
                      Enter a description and click generate
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {generatedImage && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" className="h-10 gap-2">
                <Share2 className="h-4 w-4" />
                Publish
              </Button>
              <Button variant="outline" size="lg" className="h-10 gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
