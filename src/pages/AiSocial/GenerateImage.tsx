import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function GenerateImage() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt || !title) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Create content record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: content, error: createError } = await supabase
        .from("ai_social_content")
        .insert({
          user_id: user.id,
          type: "image",
          prompt,
          status: "pending",
          title
        } as any)
        .select()
        .single();

      if (createError) throw createError;

      // Call edge function to generate image
      const { data, error } = await supabase.functions.invoke("ai-social-generate", {
        body: {
          contentId: content.id,
          type: "image",
          prompt
        }
      });

      if (error) throw error;

      setGeneratedImage(data.mediaUrl);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Generate Image</h1>
          <p className="text-muted-foreground mt-2">
            Create images with AI using Nano Banana
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Image Settings</CardTitle>
              <CardDescription>Configure your AI-generated image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="My awesome image"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to generate..."
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Image"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Generated image will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <p className="text-muted-foreground">No image generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
