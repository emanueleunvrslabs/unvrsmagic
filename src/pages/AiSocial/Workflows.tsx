import { DashboardLayout } from "@/components/dashboard-layout";
import "@/components/labs/SocialMediaCard.css";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Loader2, X, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useUserRole } from "@/hooks/useUserRole";
import type { Workflow, WorkflowContentType } from "@/types/ai-social";
import { parseScheduleConfig } from "@/types/ai-social";
import { WorkflowCard, ScheduleSection, ImageUploadSection, IMAGE_COST, VIDEO_COST, DAYS_OF_WEEK, initialFormState } from "@/components/ai-social/workflow";
import { useWorkflowExecution } from "@/hooks/use-workflow-execution";
import { createScheduledPosts, deleteScheduledPosts, type ScheduleConfig } from "@/hooks/use-workflow-scheduling";

export default function Workflows() {
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { isOwner, isAdmin } = useUserRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
  
  // Form state
  const [workflowType, setWorkflowType] = useState<"image" | "video">("image");
  const [generationMode, setGenerationMode] = useState<string>("text-to-image");
  const [workflowName, setWorkflowName] = useState("");
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // First/Last frame refs
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  
  // Video-specific state
  const [duration, setDuration] = useState("6s");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [firstFrameImage, setFirstFrameImage] = useState<string>("");
  const [lastFrameImage, setLastFrameImage] = useState<string>("");
  
  // Scheduling state
  const [scheduleFrequency, setScheduleFrequency] = useState<string>("daily");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(["09:00"]);
  const [scheduleDays, setScheduleDays] = useState<string[]>(["monday", "wednesday", "friday"]);

  // Credit check helpers
  const getRequiredCredits = (type: "image" | "video") => type === "image" ? IMAGE_COST : VIDEO_COST;
  const hasInsufficientCredits = (type: "image" | "video") => {
    if (isOwner || isAdmin) return false;
    return !creditsLoading && (credits?.balance || 0) < getRequiredCredits(type);
  };

  // Fetch connected social accounts
  const { data: connectedAccounts } = useQuery({
    queryKey: ['connected-social-accounts'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from('api_keys')
        .select('provider, owner_id')
        .eq('user_id', session.user.id)
        .in('provider', ['instagram', 'facebook', 'twitter', 'linkedin']);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch existing workflows
  const { data: workflows, refetch: refetchWorkflows } = useQuery({
    queryKey: ['ai-social-workflows'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from('ai_social_workflows')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Use execution hook
  const { runningWorkflowId, runningStage, handleRunNow } = useWorkflowExecution(
    hasInsufficientCredits,
    getRequiredCredits,
    IMAGE_COST,
    VIDEO_COST
  );

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
        body: { description, workflowType, userId: session.user.id }
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

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleWorkflowTypeChange = (type: "image" | "video") => {
    setWorkflowType(type);
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

  const handleFirstFrameUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFirstFrameImage(dataUrl);
      toast.success("First frame uploaded");
    } catch (error) {
      console.error("Error uploading first frame:", error);
      toast.error("Failed to upload first frame");
    } finally {
      setIsUploading(false);
      if (firstFrameInputRef.current) firstFrameInputRef.current.value = '';
    }
  };

  const handleLastFrameUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLastFrameImage(dataUrl);
      toast.success("Last frame uploaded");
    } catch (error) {
      console.error("Error uploading last frame:", error);
      toast.error("Failed to upload last frame");
    } finally {
      setIsUploading(false);
      if (lastFrameInputRef.current) lastFrameInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setEditingWorkflowId(null);
    setWorkflowName("");
    setWorkflowType("image");
    setGenerationMode("text-to-image");
    setDescription("");
    setAspectRatio("1:1");
    setResolution("1K");
    setOutputFormat("png");
    setSelectedPlatforms([]);
    setUploadedImages([]);
    setFirstFrameImage("");
    setLastFrameImage("");
    setDuration("6s");
    setGenerateAudio(true);
    setScheduleFrequency("daily");
    setScheduleTimes(["09:00"]);
    setScheduleDays(["monday", "wednesday", "friday"]);
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one social platform");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const scheduleConfigData: ScheduleConfig = {
        generation_mode: generationMode,
        aspect_ratio: aspectRatio,
        resolution: resolution,
        output_format: outputFormat,
        image_urls: generationMode === "image-to-video" ? uploadedImages : undefined,
        reference_image_url: generationMode === "reference-to-video" && uploadedImages.length > 0 ? uploadedImages[0] : undefined,
        first_frame_url: firstFrameImage || undefined,
        last_frame_url: lastFrameImage || undefined,
        duration: duration,
        generate_audio: generateAudio,
        frequency: scheduleFrequency,
        times: scheduleTimes,
        days: scheduleDays
      };

      const workflowData = {
        name: workflowName.trim(),
        description: description,
        content_type: workflowType,
        prompt_template: description,
        platforms: selectedPlatforms,
        schedule_config: JSON.parse(JSON.stringify(scheduleConfigData)),
        active: true
      };

      let workflowId: string;

      if (editingWorkflowId) {
        const { error } = await supabase
          .from('ai_social_workflows')
          .update(workflowData)
          .eq('id', editingWorkflowId);
        if (error) throw error;
        workflowId = editingWorkflowId;
        await deleteScheduledPosts(workflowId);
        await createScheduledPosts(workflowId, session.user.id, scheduleConfigData, selectedPlatforms);
        toast.success("Workflow updated successfully!");
      } else {
        const { data: newWorkflow, error } = await supabase
          .from('ai_social_workflows')
          .insert([{ user_id: session.user.id, ...workflowData }])
          .select()
          .single();
        if (error) throw error;
        workflowId = newWorkflow.id;
        await createScheduledPosts(workflowId, session.user.id, scheduleConfigData, selectedPlatforms);
        toast.success("Workflow created successfully!");
      }

      setIsDialogOpen(false);
      resetForm();
      refetchWorkflows();
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast.error(editingWorkflowId ? "Failed to update workflow" : "Failed to create workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    const config = parseScheduleConfig(workflow.schedule_config);
    setEditingWorkflowId(workflow.id);
    setWorkflowName(workflow.name || '');
    setWorkflowType(workflow.content_type as WorkflowContentType);
    setGenerationMode(config.generation_mode || (workflow.content_type === 'image' ? 'text-to-image' : 'text-to-video'));
    setDescription(workflow.prompt_template || workflow.description || '');
    setAspectRatio(config.aspect_ratio || '1:1');
    setResolution(config.resolution || '1K');
    setOutputFormat(config.output_format || 'png');
    setSelectedPlatforms(workflow.platforms || []);
    setUploadedImages(config.image_urls || []);
    setFirstFrameImage(config.first_frame_image || '');
    setLastFrameImage(config.last_frame_image || '');
    setDuration(config.duration || '6s');
    setGenerateAudio(config.generate_audio !== false);
    setScheduleFrequency(config.frequency || 'daily');
    const times = config.times || (config.time ? [config.time] : ['09:00']);
    setScheduleTimes(times);
    setScheduleDays(config.days || ['monday', 'wednesday', 'friday']);
    setIsDialogOpen(true);
  };

  const handleDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return;
    setIsDeleting(true);
    try {
      await deleteScheduledPosts(deleteWorkflowId);
      const { error } = await supabase
        .from('ai_social_workflows')
        .delete()
        .eq('id', deleteWorkflowId);
      if (error) throw error;
      toast.success("Workflow deleted successfully!");
      refetchWorkflows();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    } finally {
      setIsDeleting(false);
      setDeleteWorkflowId(null);
    }
  };

  const handleToggleWorkflowActive = async (workflowId: string, currentActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('ai_social_workflows')
        .update({ active: !currentActive })
        .eq('id', workflowId);
      if (error) throw error;

      if (currentActive) {
        await deleteScheduledPosts(workflowId);
        toast.success("Workflow paused - scheduled posts removed");
      } else {
        const { data: workflow } = await supabase
          .from('ai_social_workflows')
          .select('*')
          .eq('id', workflowId)
          .single();

        if (workflow) {
          if (hasInsufficientCredits(workflow.content_type as "image" | "video")) {
            const requiredCredits = getRequiredCredits(workflow.content_type as "image" | "video");
            toast.error(`Insufficient credits. You need at least €${requiredCredits} to activate this workflow.`);
            await supabase.from('ai_social_workflows').update({ active: false }).eq('id', workflowId);
            refetchWorkflows();
            return;
          }
          await createScheduledPosts(workflowId, session.user.id, parseScheduleConfig(workflow.schedule_config), workflow.platforms);
          toast.success("Workflow activated - scheduled posts created");
        }
      }
      refetchWorkflows();
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Failed to update workflow status");
    }
  };

  const openNewWorkflowDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const socialPlatforms = [
    { id: 'instagram', name: 'Instagram' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'twitter', name: 'Twitter' },
    { id: 'linkedin', name: 'LinkedIn' },
  ].filter(platform => connectedAccounts?.some(a => a.provider === platform.id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automated Workflows</h1>
            <p className="text-muted-foreground mt-2">
              Create automated content generation and publishing flows
            </p>
          </div>
          <Button onClick={openNewWorkflowDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>

        <div className="labs-client-card rounded-[22px] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Your Workflows</h3>
            <p className="text-sm text-white/50 mt-1">Manage automated content workflows</p>
          </div>
          <div>
            {workflows && workflows.length > 0 ? (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    isRunning={runningWorkflowId === workflow.id}
                    runningStage={runningWorkflowId === workflow.id ? runningStage : null}
                    onRunNow={() => handleRunNow(workflow, refetchWorkflows)}
                    onEdit={() => handleEditWorkflow(workflow)}
                    onDelete={() => setDeleteWorkflowId(workflow.id)}
                    onToggleActive={() => handleToggleWorkflowActive(workflow.id, workflow.active ?? false)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/50">
                <p>No workflows yet. Create your first automated workflow!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWorkflowId ? "Edit Workflow" : "Create New Workflow"}</DialogTitle>
            <DialogDescription>
              Configure your automated content generation and publishing workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Workflow Name */}
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="My Awesome Workflow"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Content Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={workflowType} onValueChange={(v) => handleWorkflowTypeChange(v as "image" | "video")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Generation Mode</Label>
                <Select value={generationMode} onValueChange={handleGenerationModeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {workflowType === "image" ? (
                      <>
                        <SelectItem value="text-to-image">Text to Image</SelectItem>
                        <SelectItem value="image-to-image">Image to Image</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="text-to-video">Text to Video</SelectItem>
                        <SelectItem value="image-to-video">Image to Video</SelectItem>
                        <SelectItem value="first-last-frame">First/Last Frame</SelectItem>
                        <SelectItem value="reference-to-video">Reference to Video</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Upload for Image-to-Image, Image-to-Video, Reference-to-Video */}
            {(generationMode === "image-to-image" || generationMode === "image-to-video" || generationMode === "reference-to-video") && (
              <ImageUploadSection
                label={generationMode === "reference-to-video" ? "Reference Images" : "Source Images"}
                description={generationMode === "reference-to-video" ? "Upload reference images for character/object consistency" : "Upload images to process"}
                images={uploadedImages}
                onImagesChange={setUploadedImages}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
            )}

            {/* First/Last Frame Upload */}
            {generationMode === "first-last-frame" && (
              <div className="space-y-3">
                <Label>First & Last Frame Images</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">First Frame</Label>
                    <div className="border border-dashed border-border rounded-lg p-4">
                      <input type="file" ref={firstFrameInputRef} onChange={handleFirstFrameUpload} accept="image/*" className="hidden" />
                      {firstFrameImage ? (
                        <div className="relative group">
                          <img src={firstFrameImage} alt="First frame" className="w-full h-32 object-cover rounded-lg" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFirstFrameImage("")}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors" onClick={() => firstFrameInputRef.current?.click()}>
                          {isUploading ? <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" /> : <><Upload className="h-6 w-6 text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">Upload first frame</p></>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Last Frame</Label>
                    <div className="border border-dashed border-border rounded-lg p-4">
                      <input type="file" ref={lastFrameInputRef} onChange={handleLastFrameUpload} accept="image/*" className="hidden" />
                      {lastFrameImage ? (
                        <div className="relative group">
                          <img src={lastFrameImage} alt="Last frame" className="w-full h-32 object-cover rounded-lg" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setLastFrameImage("")}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors" onClick={() => lastFrameInputRef.current?.click()}>
                          {isUploading ? <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" /> : <><Upload className="h-6 w-6 text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">Upload last frame</p></>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description with AI Enhancement */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe what kind of content you want to generate..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              <Button type="button" variant="outline" size="sm" onClick={handleEnhancePrompt} disabled={isEnhancing || !description.trim()} className="mt-2">
                {isEnhancing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enhancing...</> : <><Sparkles className="mr-2 h-4 w-4" />Enhance with AI</>}
              </Button>
            </div>

            {/* Image-specific settings */}
            {workflowType === "image" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="3:4">3:4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1K">1K</SelectItem>
                      <SelectItem value="2K">2K</SelectItem>
                      <SelectItem value="4K">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="webp">WEBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Video-specific settings */}
            {workflowType === "video" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {generationMode !== "reference-to-video" && (
                    <div className="space-y-2">
                      <Label>Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {generationMode !== "reference-to-video" && generationMode !== "first-last-frame" && (
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4s">4 seconds</SelectItem>
                          <SelectItem value="6s">6 seconds</SelectItem>
                          <SelectItem value="8s">8 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between space-x-2 py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="generate-audio">Generate Audio</Label>
                    <p className="text-xs text-muted-foreground">Disable to save 50% credits</p>
                  </div>
                  <Switch id="generate-audio" checked={generateAudio} onCheckedChange={setGenerateAudio} />
                </div>
              </div>
            )}

            {/* Social Platforms Selection */}
            <div className="space-y-3">
              <Label>Publish to Social Platforms</Label>
              {socialPlatforms.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {socialPlatforms.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer" onClick={() => handlePlatformToggle(platform.id)}>
                      <Checkbox id={`platform-${platform.id}`} checked={selectedPlatforms.includes(platform.id)} onCheckedChange={() => handlePlatformToggle(platform.id)} />
                      <div className="flex-1">
                        <label htmlFor={`platform-${platform.id}`} className="text-sm font-medium cursor-pointer">{platform.name}</label>
                        <p className="text-xs text-green-500">Connected</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                  No social accounts connected. Go to Connections to link your accounts.
                </p>
              )}
            </div>

            {/* Schedule Configuration */}
            <ScheduleSection
              frequency={scheduleFrequency}
              times={scheduleTimes}
              days={scheduleDays}
              onFrequencyChange={setScheduleFrequency}
              onTimesChange={setScheduleTimes}
              onDaysChange={setScheduleDays}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveWorkflow} disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : (editingWorkflowId ? "Update Workflow" : "Create Workflow")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteWorkflowId} onOpenChange={(open) => !open && setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this workflow? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkflow} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
