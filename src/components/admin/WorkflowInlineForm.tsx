import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkflowInlineFormProps {
  projectId: string;
  onCancel: () => void;
  onWorkflowCreated: () => void;
}

export function WorkflowInlineForm({ projectId, onCancel, onWorkflowCreated }: WorkflowInlineFormProps) {
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
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [firstFrameImage, setFirstFrameImage] = useState("");
  const [lastFrameImage, setLastFrameImage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);

  const handleContentTypeChange = (type: "image" | "video") => {
    setContentType(type);
    setGenerationMode(type === "image" ? "text-to-image" : "text-to-video");
    if (type === "video") {
      setAspectRatio("16:9");
      setResolution("720p");
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
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await readFileAsDataUrl(file);
        newImageUrls.push(dataUrl);
      }
      setUploadedImages(prev => [...prev, ...newImageUrls]);
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFrameUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'first' | 'last') => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (type === 'first') setFirstFrameImage(dataUrl);
      else setLastFrameImage(dataUrl);
    } catch (error) {
      toast.error("Failed to upload frame");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!description.trim()) return;
    setIsEnhancing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.functions.invoke("enhance-workflow-prompt", {
        body: { description, workflowType: contentType, userId: session.user.id }
      });
      if (error) throw error;
      if (data?.enhancedPrompt) setDescription(data.enhancedPrompt);
    } catch (error) {
      toast.error("Failed to enhance prompt");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!workflowName.trim() || !description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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
          description: description.trim(),
          content_type: contentType,
          prompt_template: description.trim(),
          schedule_config: scheduleConfig,
          active: true,
        });

      if (error) throw error;
      toast.success("Workflow created!");
      onWorkflowCreated();
    } catch (error) {
      toast.error("Failed to create workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const needsImageUpload = generationMode === "image-to-image" || generationMode === "image-to-video" || generationMode === "reference-to-video";
  const needsFirstLastFrame = generationMode === "first-last-frame";
  const isVideoMode = contentType === "video";

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-sm font-semibold text-white/90">New Workflow</div>
      
      {/* Name */}
      <Input
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        placeholder="Workflow name"
        className="bg-white/5 border-white/10 text-white text-xs h-8 placeholder:text-white/40"
      />

      {/* Content Type & Mode */}
      <div className="grid grid-cols-2 gap-2">
        <Select value={contentType} onValueChange={(v) => handleContentTypeChange(v as "image" | "video")}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <Select value={generationMode} onValueChange={handleGenerationModeChange}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
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
                <SelectItem value="first-last-frame">First/Last Frame</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Image Upload */}
      {needsImageUpload && (
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-10 h-10 border border-dashed border-white/20 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 flex-shrink-0">
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin text-white/60" /> : <Upload className="h-3 w-3 text-white/60" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple={generationMode !== "reference-to-video"} onChange={handleImageUpload} className="hidden" />
          <div className="flex flex-wrap gap-1 flex-1">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative w-10 h-10">
                <img src={img} alt="" className="w-full h-full object-cover rounded" />
                <button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500/80 rounded-full p-0.5">
                  <X className="w-2 h-2 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* First/Last Frame */}
      {needsFirstLastFrame && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-white/60">First:</span>
            {firstFrameImage ? (
              <div className="relative w-8 h-8">
                <img src={firstFrameImage} alt="" className="w-full h-full object-cover rounded" />
                <button onClick={() => setFirstFrameImage("")} className="absolute -top-1 -right-1 bg-red-500/80 rounded-full p-0.5"><X className="w-2 h-2 text-white" /></button>
              </div>
            ) : (
              <button onClick={() => firstFrameInputRef.current?.click()} className="w-8 h-8 border border-dashed border-white/20 rounded flex items-center justify-center bg-white/5">
                <Upload className="h-2 w-2 text-white/60" />
              </button>
            )}
            <input ref={firstFrameInputRef} type="file" accept="image/*" onChange={(e) => handleFrameUpload(e, 'first')} className="hidden" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-white/60">Last:</span>
            {lastFrameImage ? (
              <div className="relative w-8 h-8">
                <img src={lastFrameImage} alt="" className="w-full h-full object-cover rounded" />
                <button onClick={() => setLastFrameImage("")} className="absolute -top-1 -right-1 bg-red-500/80 rounded-full p-0.5"><X className="w-2 h-2 text-white" /></button>
              </div>
            ) : (
              <button onClick={() => lastFrameInputRef.current?.click()} className="w-8 h-8 border border-dashed border-white/20 rounded flex items-center justify-center bg-white/5">
                <Upload className="h-2 w-2 text-white/60" />
              </button>
            )}
            <input ref={lastFrameInputRef} type="file" accept="image/*" onChange={(e) => handleFrameUpload(e, 'last')} className="hidden" />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="relative">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description..."
          className="bg-white/5 border-white/10 text-white text-xs placeholder:text-white/40 min-h-[60px] pr-16"
        />
        <button
          onClick={handleEnhancePrompt}
          disabled={isEnhancing || !description.trim()}
          className="absolute top-1 right-1 text-[10px] px-2 py-1 rounded-xl bg-primary/20 text-primary/80 border border-primary/30 hover:bg-primary/30 disabled:opacity-50"
        >
          {isEnhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        </button>
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-3 gap-2">
        <Select value={aspectRatio} onValueChange={setAspectRatio}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white text-[10px] h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {contentType === "image" ? (
              <>
                <SelectItem value="1:1">1:1</SelectItem>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <Select value={resolution} onValueChange={setResolution}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white text-[10px] h-7">
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
        {contentType === "image" ? (
          <Select value={outputFormat} onValueChange={setOutputFormat}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-[10px] h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select value={duration} onValueChange={setDuration} disabled={generationMode === "reference-to-video"}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-[10px] h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              <SelectItem value="4s">4s</SelectItem>
              <SelectItem value="6s">6s</SelectItem>
              <SelectItem value="8s">8s</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Video Audio Toggle */}
      {isVideoMode && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/60">Generate Audio</span>
          <Switch checked={generateAudio} onCheckedChange={setGenerateAudio} className="scale-75" />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        <Button onClick={onCancel} variant="ghost" className="flex-1 h-8 text-xs text-white/60 hover:text-white hover:bg-white/10">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-8 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30">
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
        </Button>
      </div>
    </div>
  );
}
