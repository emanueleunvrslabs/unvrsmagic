import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onWorkflowCreated?: () => void;
}

export function ClientWorkflowDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  onWorkflowCreated
}: ClientWorkflowDialogProps) {
  const [workflowName, setWorkflowName] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<"image" | "video">("image");
  const [generationMode, setGenerationMode] = useState("text-to-image");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [duration, setDuration] = useState("6s");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [firstFrameImage, setFirstFrameImage] = useState("");
  const [lastFrameImage, setLastFrameImage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setWorkflowName("");
    setDescription("");
    setContentType("image");
    setGenerationMode("text-to-image");
    setAspectRatio("1:1");
    setResolution("1K");
    setOutputFormat("png");
    setDuration("6s");
    setGenerateAudio(true);
    setUploadedImages([]);
    setFirstFrameImage("");
    setLastFrameImage("");
  };

  const handleContentTypeChange = (type: "image" | "video") => {
    setContentType(type);
    setGenerationMode(type === "image" ? "text-to-image" : "text-to-video");
    if (type === "video") {
      setAspectRatio("16:9");
      setResolution("720p");
      setDuration("6s");
    } else {
      setAspectRatio("1:1");
      setResolution("1K");
    }
    setUploadedImages([]);
    setFirstFrameImage("");
    setLastFrameImage("");
  };

  const handleGenerationModeChange = (mode: string) => {
    setGenerationMode(mode);
    setUploadedImages([]);
    setFirstFrameImage("");
    setLastFrameImage("");
    if (mode === "reference-to-video" || mode === "first-last-frame") {
      setDuration("8s");
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newImageUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        const dataUrl = await readFileAsDataUrl(file);
        newImageUrls.push(dataUrl);
      }
      setUploadedImages(prev => [...prev, ...newImageUrls]);
      toast.success(`${newImageUrls.length} image(s) uploaded`);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFirstFrameUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFirstFrameImage(dataUrl);
      toast.success("First frame uploaded");
    } catch (error) {
      toast.error("Failed to upload first frame");
    } finally {
      setIsUploading(false);
      if (firstFrameInputRef.current) firstFrameInputRef.current.value = '';
    }
  };

  const handleLastFrameUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLastFrameImage(dataUrl);
      toast.success("Last frame uploaded");
    } catch (error) {
      toast.error("Failed to upload last frame");
    } finally {
      setIsUploading(false);
      if (lastFrameInputRef.current) lastFrameInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleEnhancePrompt = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description first");
      return;
    }
    setIsEnhancing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login first");
        return;
      }
      const { data, error } = await supabase.functions.invoke("enhance-workflow-prompt", {
        body: { description, workflowType: contentType, userId: session.user.id }
      });
      if (error) throw error;
      if (data?.enhancedPrompt) {
        setDescription(data.enhancedPrompt);
        toast.success("Prompt enhanced successfully!");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      toast.error("Failed to enhance prompt");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login first");
        return;
      }

      const scheduleConfig = {
        generation_mode: generationMode,
        aspect_ratio: aspectRatio,
        resolution: resolution,
        output_format: outputFormat,
        image_urls: generationMode === "image-to-image" || generationMode === "image-to-video" ? uploadedImages : undefined,
        reference_image_url: generationMode === "reference-to-video" && uploadedImages.length > 0 ? uploadedImages[0] : undefined,
        first_frame_url: firstFrameImage || undefined,
        last_frame_url: lastFrameImage || undefined,
        duration: contentType === "video" ? duration : undefined,
        generate_audio: contentType === "video" ? generateAudio : undefined,
      };

      const { error } = await supabase
        .from('client_project_workflows')
        .insert({
          client_project_id: projectId,
          user_id: session.user.id,
          name: workflowName.trim(),
          description: description.trim() || null,
          content_type: contentType,
          prompt_template: description.trim(),
          schedule_config: scheduleConfig,
          active: true,
        });

      if (error) throw error;

      toast.success("Workflow created successfully!");
      resetForm();
      onOpenChange(false);
      onWorkflowCreated?.();
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Failed to create workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const needsImageUpload = generationMode === "image-to-image" || generationMode === "image-to-video" || generationMode === "reference-to-video";
  const needsFirstLastFrame = generationMode === "first-last-frame";
  const isVideoMode = contentType === "video";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism-modal max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white/90">New Workflow</DialogTitle>
          <DialogDescription className="text-white/60">
            Create an automated workflow for {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Workflow Name */}
          <div className="space-y-2">
            <Label className="text-white/80">Workflow Name</Label>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter workflow name"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label className="text-white/80">Content Type</Label>
            <Select value={contentType} onValueChange={(v) => handleContentTypeChange(v as "image" | "video")}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generation Mode */}
          <div className="space-y-2">
            <Label className="text-white/80">Generation Mode</Label>
            <Select value={generationMode} onValueChange={handleGenerationModeChange}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {contentType === "image" ? (
                  <>
                    <SelectItem value="text-to-image">Text to Image</SelectItem>
                    <SelectItem value="image-to-image">Image to Image</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="text-to-video">Text to Video</SelectItem>
                    <SelectItem value="image-to-video">Image to Video</SelectItem>
                    <SelectItem value="reference-to-video">Reference to Video</SelectItem>
                    <SelectItem value="first-last-frame">First/Last Frame to Video</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload for relevant modes */}
          {needsImageUpload && (
            <div className="space-y-2">
              <Label className="text-white/80">
                {generationMode === "reference-to-video" ? "Reference Image" : "Input Image(s)"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative w-16 h-16">
                    <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500/80 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || (generationMode === "reference-to-video" && uploadedImages.length >= 1)}
                  className="w-16 h-16 border-dashed border-white/20 bg-white/5 hover:bg-white/10"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={generationMode !== "reference-to-video"}
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          )}

          {/* First/Last Frame Upload */}
          {needsFirstLastFrame && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">First Frame</Label>
                <div className="flex items-center gap-2">
                  {firstFrameImage ? (
                    <div className="relative w-16 h-16">
                      <img src={firstFrameImage} alt="First frame" className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => setFirstFrameImage("")}
                        className="absolute -top-1 -right-1 bg-red-500/80 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => firstFrameInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-16 h-16 border-dashed border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input ref={firstFrameInputRef} type="file" accept="image/*" onChange={handleFirstFrameUpload} className="hidden" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Last Frame</Label>
                <div className="flex items-center gap-2">
                  {lastFrameImage ? (
                    <div className="relative w-16 h-16">
                      <img src={lastFrameImage} alt="Last frame" className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => setLastFrameImage("")}
                        className="absolute -top-1 -right-1 bg-red-500/80 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => lastFrameInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-16 h-16 border-dashed border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input ref={lastFrameInputRef} type="file" accept="image/*" onChange={handleLastFrameUpload} className="hidden" />
              </div>
            </div>
          )}

          {/* Description with Enhance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !description.trim()}
                className="text-primary/80 hover:text-primary hover:bg-primary/10 h-7 px-2"
              >
                {isEnhancing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Enhance
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the content you want to generate..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px]"
            />
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label className="text-white/80">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {contentType === "image" ? (
                  <>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label className="text-white/80">Resolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {contentType === "image" ? (
                  <>
                    <SelectItem value="1K">1K</SelectItem>
                    <SelectItem value="2K">2K</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Output Format (Image only) */}
          {contentType === "image" && (
            <div className="space-y-2">
              <Label className="text-white/80">Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Video Duration */}
          {isVideoMode && generationMode !== "reference-to-video" && (
            <div className="space-y-2">
              <Label className="text-white/80">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="4s">4 seconds</SelectItem>
                  <SelectItem value="6s">6 seconds</SelectItem>
                  <SelectItem value="8s">8 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Generate Audio (Video only) */}
          {isVideoMode && (
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Generate Audio</Label>
              <Switch
                checked={generateAudio}
                onCheckedChange={setGenerateAudio}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Create Workflow"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
