import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Loader2, X, Pencil, Trash2, Upload, Clock, Play, Pause, Rocket } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

export default function Workflows() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
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
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);
  const [runningStage, setRunningStage] = useState<"openai" | "nano" | "instagram" | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Video-specific state
  const [duration, setDuration] = useState("6s");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [firstFrameImage, setFirstFrameImage] = useState<string>("");
  const [lastFrameImage, setLastFrameImage] = useState<string>("");
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  
  // Scheduling state
  const [scheduleFrequency, setScheduleFrequency] = useState<string>("daily");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(["09:00"]);
  const [scheduleDays, setScheduleDays] = useState<string[]>(["monday", "wednesday", "friday"]);

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
        body: {
          description,
          workflowType,
          userId: session.user.id
        }
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
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleWorkflowTypeChange = (type: "image" | "video") => {
    setWorkflowType(type);
    // Reset generation mode based on type
    setGenerationMode(type === "image" ? "text-to-image" : "text-to-video");
    // Reset aspect ratio and resolution to type-compatible defaults
    if (type === "video") {
      setAspectRatio("16:9");
      setResolution("720p");
      setDuration("6s");
    } else {
      setAspectRatio("1:1");
      setResolution("1K");
    }
    // Clear uploaded images when changing type
    setUploadedImages([]);
    setFirstFrameImage("");
    setLastFrameImage("");
  };

  const handleGenerationModeChange = (mode: string) => {
    setGenerationMode(mode);
    // Clear images when changing mode
    setUploadedImages([]);
    setFirstFrameImage("");
    setLastFrameImage("");
    // Set default duration for reference-to-video
    if (mode === "reference-to-video") {
      setDuration("8s");
    }
  };

  // Helper function to read file as base64 data URL
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
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      // Use base64 data URL directly (like GenerateImage page)
      const dataUrl = await readFileAsDataUrl(file);
      setFirstFrameImage(dataUrl);
      toast.success("First frame uploaded");
    } catch (error) {
      console.error("Error uploading first frame:", error);
      toast.error("Failed to upload first frame");
    } finally {
      setIsUploading(false);
      if (firstFrameInputRef.current) {
        firstFrameInputRef.current.value = '';
      }
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
      // Use base64 data URL directly (like GenerateImage page)
      const dataUrl = await readFileAsDataUrl(file);
      setLastFrameImage(dataUrl);
      toast.success("Last frame uploaded");
    } catch (error) {
      console.error("Error uploading last frame:", error);
      toast.error("Failed to upload last frame");
    } finally {
      setIsUploading(false);
      if (lastFrameInputRef.current) {
        lastFrameInputRef.current.value = '';
      }
    }
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

        // Use base64 data URL directly (like GenerateImage page)
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Calculate next scheduled times based on schedule config
  const calculateNextScheduledTimes = (
    frequency: string,
    times: string[],
    days: string[],
    daysToSchedule: number = 7
  ): Date[] => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const scheduledDates: Date[] = [];
    const now = new Date();
    const sortedTimes = [...times].sort();

    for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      const dayName = dayNames[checkDate.getDay()];

      // Check if this day is valid for the frequency
      let isDayValid = false;
      if (frequency === "daily") {
        isDayValid = true;
      } else if (frequency === "weekly" || frequency === "custom") {
        isDayValid = days.includes(dayName);
      } else if (frequency === "once") {
        isDayValid = dayOffset === 0; // Only today for "once"
      }

      if (!isDayValid) continue;

      // Add each time slot for this day
      for (const timeStr of sortedTimes) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const candidateTime = new Date(checkDate);
        candidateTime.setHours(hours, minutes, 0, 0);

        // Only add future times (at least 1 minute from now)
        if (candidateTime.getTime() > now.getTime() + 60000) {
          scheduledDates.push(candidateTime);
        }
      }
    }

    return scheduledDates;
  };

  // Create scheduled posts for a workflow
  const createScheduledPosts = async (workflowId: string, userId: string, scheduleConfig: any, platforms: string[]) => {
    const { frequency, times, days } = scheduleConfig;
    
    // Calculate next 7 days of scheduled times
    const scheduledTimes = calculateNextScheduledTimes(frequency, times, days, 7);
    
    if (scheduledTimes.length === 0) {
      console.log("No scheduled times calculated");
      return;
    }

    console.log(`Creating ${scheduledTimes.length} scheduled posts`);

    // Insert scheduled posts
    const postsToInsert = scheduledTimes.map(scheduledAt => ({
      workflow_id: workflowId,
      user_id: userId,
      scheduled_at: scheduledAt.toISOString(),
      status: 'scheduled',
      platforms: platforms,
      metadata: { schedule_config: scheduleConfig }
    }));

    const { error } = await supabase
      .from('ai_social_scheduled_posts')
      .insert(postsToInsert);

    if (error) {
      console.error("Error creating scheduled posts:", error);
      throw error;
    }
  };

  // Delete all scheduled posts for a workflow
  const deleteScheduledPosts = async (workflowId: string) => {
    const { error } = await supabase
      .from('ai_social_scheduled_posts')
      .delete()
      .eq('workflow_id', workflowId)
      .eq('status', 'scheduled');

    if (error) {
      console.error("Error deleting scheduled posts:", error);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    const finalPrompt = description;
    
    if (!finalPrompt.trim()) {
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

      const scheduleConfigData = {
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
        prompt_template: finalPrompt,
        platforms: selectedPlatforms,
        schedule_config: scheduleConfigData,
        active: true
      };

      let workflowId: string;

      if (editingWorkflowId) {
        // Update existing workflow
        const { error } = await supabase
          .from('ai_social_workflows')
          .update(workflowData)
          .eq('id', editingWorkflowId);

        if (error) throw error;
        workflowId = editingWorkflowId;

        // Delete existing scheduled posts and recreate
        await deleteScheduledPosts(workflowId);
        await createScheduledPosts(workflowId, session.user.id, scheduleConfigData, selectedPlatforms);
        
        toast.success("Workflow updated successfully!");
      } else {
        // Create new workflow
        const { data: newWorkflow, error } = await supabase
          .from('ai_social_workflows')
          .insert({
            user_id: session.user.id,
            ...workflowData
          })
          .select()
          .single();

        if (error) throw error;
        workflowId = newWorkflow.id;

        // Create scheduled posts for the new workflow
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

  const handleEditWorkflow = (workflow: any) => {
    setEditingWorkflowId(workflow.id);
    setWorkflowName(workflow.name || '');
    setWorkflowType(workflow.content_type);
    setGenerationMode(workflow.schedule_config?.generation_mode || (workflow.content_type === 'image' ? 'text-to-image' : 'text-to-video'));
    setDescription(workflow.prompt_template || workflow.description || '');
    setAspectRatio(workflow.schedule_config?.aspect_ratio || '1:1');
    setResolution(workflow.schedule_config?.resolution || '1K');
    setOutputFormat(workflow.schedule_config?.output_format || 'png');
    setSelectedPlatforms(workflow.platforms || []);
    setUploadedImages(workflow.schedule_config?.image_urls || []);
    setFirstFrameImage(workflow.schedule_config?.first_frame_image || '');
    setLastFrameImage(workflow.schedule_config?.last_frame_image || '');
    setDuration(workflow.schedule_config?.duration || '6s');
    setGenerateAudio(workflow.schedule_config?.generate_audio !== false);
    setScheduleFrequency(workflow.schedule_config?.frequency || 'daily');
    // Support both old single time and new multiple times format
    const times = workflow.schedule_config?.times || (workflow.schedule_config?.time ? [workflow.schedule_config.time] : ['09:00']);
    setScheduleTimes(times);
    setScheduleDays(workflow.schedule_config?.days || ['monday', 'wednesday', 'friday']);
    setIsDialogOpen(true);
  };

  const handleDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return;

    setIsDeleting(true);
    try {
      // Delete scheduled posts first
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

      // Update workflow active status
      const { error } = await supabase
        .from('ai_social_workflows')
        .update({ active: !currentActive })
        .eq('id', workflowId);

      if (error) throw error;

      if (currentActive) {
        // Deactivating: Delete all scheduled posts
        await deleteScheduledPosts(workflowId);
        toast.success("Workflow paused - scheduled posts removed");
      } else {
        // Activating: Get workflow and create scheduled posts
        const { data: workflow } = await supabase
          .from('ai_social_workflows')
          .select('*')
          .eq('id', workflowId)
          .single();

        if (workflow) {
          await createScheduledPosts(
            workflowId, 
            session.user.id, 
            workflow.schedule_config, 
            workflow.platforms
          );
          toast.success("Workflow activated - scheduled posts created");
        }
      }

      refetchWorkflows();
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Failed to update workflow status");
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

  const handleDayToggle = (day: string) => {
    setScheduleDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleRunNow = async (workflow: any) => {
    setRunningWorkflowId(workflow.id);
    setRunningStage("openai");
    const isVideo = workflow.content_type === "video";
    
    const startTime = Date.now();
    const formatElapsed = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      return `${elapsed}s`;
    };
    
    toast.info("Starting workflow...", { description: "Preparing and sending request..." });
    
    let pollingInterval: NodeJS.Timeout | null = null;
    let contentId: string | null = null;
    let lastStatus: string | null = null;
    
    try {
      // Call the edge function - it returns immediately with contentId
      const invokePromise = supabase.functions.invoke('run-workflow', {
        body: { workflowId: workflow.id }
      });

      // Wait a moment for content record to be created, then start polling
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start polling for actual content status
      const pollForContent = async (): Promise<{ status: string; media_url?: string } | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data: contents } = await supabase
          .from('ai_social_content')
          .select('id, status, media_url, error_message')
          .eq('user_id', session.user.id)
          .gte('created_at', new Date(startTime - 5000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (contents && contents.length > 0) {
          const content = contents[0];
          contentId = content.id;
          return { status: content.status, media_url: content.media_url };
        }
        return null;
      };

      // Poll and update UI with real status
      const updateUIFromStatus = async () => {
        const result = await pollForContent();
        if (!result) return;

        const { status, media_url } = result;
        
        // Only update if status changed
        if (status !== lastStatus) {
          lastStatus = status;
          
          if (status === 'generating') {
            setRunningStage("nano");
            if (isVideo) {
              toast.info(`Generating video... (${formatElapsed()})`, { 
                description: "Veo3 is working... this takes 60-120 seconds" 
              });
            } else {
              toast.info(`Generating image... (${formatElapsed()})`, { 
                description: "Nano Banana is working... this takes 30-60 seconds" 
              });
            }
          } else if (status === 'completed' && media_url) {
            // Content is ready, now check if publishing to Instagram
            if (workflow.platforms?.includes("instagram")) {
              setRunningStage("instagram");
              toast.info(`Publishing to Instagram... (${formatElapsed()})`, { 
                description: "Uploading content to Instagram..." 
              });
            }
          }
        }
      };

      // Poll every 3 seconds
      pollingInterval = setInterval(updateUIFromStatus, 3000);
      
      // Initial poll
      await updateUIFromStatus();

      // Wait for edge function to complete (this includes Instagram publishing)
      const { data, error } = await invokePromise;

      // Clean up polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Show success message with total time
      const totalTime = formatElapsed();
      if (data?.instagram?.success) {
        toast.success(`Workflow completed! (${totalTime})`, { 
          description: "Content generated and published to Instagram!" 
        });
      } else if (data?.instagram?.error) {
        toast.success(`${isVideo ? 'Video' : 'Image'} generated! (${totalTime})`, { 
          description: `Content created but Instagram failed: ${data.instagram.error}` 
        });
      } else {
        toast.success(`Workflow completed! (${totalTime})`, { 
          description: "Content generated successfully!" 
        });
      }

      // Refresh workflows to update last_run_at
      refetchWorkflows();
    } catch (error) {
      console.error("Error running workflow:", error);
      const totalTime = formatElapsed();
      toast.error(`Failed to run workflow (${totalTime})`, {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      setRunningWorkflowId(null);
      setRunningStage(null);
    }
  };

  const openNewWorkflowDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Only show connected social platforms
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

        <Card>
          <CardHeader>
            <CardTitle>Your Workflows</CardTitle>
            <CardDescription>Manage automated content workflows</CardDescription>
          </CardHeader>
          <CardContent>
            {workflows && workflows.length > 0 ? (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div>
                        <h3 className="font-medium">{workflow.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {/* Run Now Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunNow(workflow)}
                              disabled={runningWorkflowId === workflow.id}
                              className="bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary h-7 text-xs"
                            >
                              {runningWorkflowId === workflow.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Running...
                                </>
                              ) : (
                                <>
                                  <Rocket className="h-3 w-3 mr-1" />
                                  Run Now
                                </>
                              )}
                            </Button>
                            {/* OpenAI Badge */}
                            <span 
                              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                                runningWorkflowId === workflow.id && runningStage === "openai"
                                  ? "bg-emerald-500/30 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}
                              style={runningWorkflowId === workflow.id && runningStage === "openai" ? { animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                              </svg>
                              OpenAI
                            </span>
                            {/* Generation Model Badge - Nano for images, Veo3 for videos */}
                            {workflow.content_type === "video" ? (
                              <span 
                                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                                  runningWorkflowId === workflow.id && runningStage === "nano"
                                    ? "bg-purple-500/30 text-purple-300 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                    : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                }`}
                                style={runningWorkflowId === workflow.id && runningStage === "nano" ? { animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}
                              >
                                Veo3 🎬
                              </span>
                            ) : (
                              <span 
                                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                                  runningWorkflowId === workflow.id && runningStage === "nano"
                                    ? "bg-yellow-500/30 text-yellow-300 border-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                }`}
                                style={runningWorkflowId === workflow.id && runningStage === "nano" ? { animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}
                              >
                                Nano 🍌
                              </span>
                            )}
                            {/* Social Platform Badges */}
                            {workflow.platforms?.map((platform: string) => (
                              <span 
                                key={platform} 
                                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm capitalize transition-all duration-300 ${
                                  runningWorkflowId === workflow.id && runningStage === "instagram" && platform === "instagram"
                                    ? "bg-pink-500/30 text-pink-300 border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                                    : "bg-pink-500/10 text-pink-400 border-pink-500/20"
                                }`}
                                style={runningWorkflowId === workflow.id && runningStage === "instagram" && platform === "instagram" ? { animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}
                              >
                                {platform === 'instagram' && (
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                  </svg>
                                )}
                                {platform === 'facebook' && (
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                  </svg>
                                )}
                                {platform === 'twitter' && (
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                )}
                                {platform === 'linkedin' && (
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                )}
                            {platform}
                            </span>
                          ))}
                          
                          {/* Action Buttons - on same row as badges */}
                          <div className="flex items-center gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleToggleWorkflowActive(workflow.id, workflow.active)}
                              title={workflow.active ? "Pause workflow" : "Activate workflow"}
                            >
                              {workflow.active ? (
                                <Pause className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditWorkflow(workflow)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteWorkflowId(workflow.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No workflows configured yet. Create your first automated workflow!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWorkflowId ? 'Edit Workflow' : 'Create New Workflow'}</DialogTitle>
            <DialogDescription>
              {editingWorkflowId ? 'Modify your workflow settings' : 'Set up an automated content generation workflow'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Workflow Name */}
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input
                placeholder="Enter workflow name..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>

            {/* Workflow Type */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={workflowType} onValueChange={(v) => handleWorkflowTypeChange(v as "image" | "video")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generation Mode */}
            <div className="space-y-2">
              <Label>Generation Mode</Label>
              {workflowType === "image" ? (
                <Select value={generationMode} onValueChange={setGenerationMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-to-image">Text to Image</SelectItem>
                    <SelectItem value="image-to-image">Image to Image</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={generationMode} onValueChange={handleGenerationModeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-to-video">Text to Video</SelectItem>
                    <SelectItem value="image-to-video">Image to Video</SelectItem>
                    <SelectItem value="reference-to-video">Reference to Video</SelectItem>
                    <SelectItem value="first-last-frame">First/Last Frame to Video</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Image Upload for Image-to-Image mode */}
            {generationMode === "image-to-image" && (
              <div className="space-y-3">
                <Label>Source Images</Label>
                <div className="border border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  
                  {uploadedImages.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add More Images
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload images</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP supported</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Upload for Image-to-Video and Reference-to-Video modes */}
            {(generationMode === "image-to-video" || generationMode === "reference-to-video") && (
              <div className="space-y-3">
                <Label>{generationMode === "reference-to-video" ? "Reference Images" : "Input Images"}</Label>
                <div className="border border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  
                  {uploadedImages.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add More Images
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {generationMode === "reference-to-video" 
                              ? "Upload reference images for character/object consistency" 
                              : "Upload images to animate"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP supported</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* First/Last Frame Upload for First-Last-Frame mode */}
            {generationMode === "first-last-frame" && (
              <div className="space-y-3">
                <Label>First & Last Frame Images</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* First Frame */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">First Frame</Label>
                    <div className="border border-dashed border-border rounded-lg p-4">
                      <input
                        type="file"
                        ref={firstFrameInputRef}
                        onChange={handleFirstFrameUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {firstFrameImage ? (
                        <div className="relative group">
                          <img
                            src={firstFrameImage}
                            alt="First frame"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setFirstFrameImage("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                          onClick={() => firstFrameInputRef.current?.click()}
                        >
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                              <p className="text-xs text-muted-foreground">Upload first frame</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Last Frame */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Last Frame</Label>
                    <div className="border border-dashed border-border rounded-lg p-4">
                      <input
                        type="file"
                        ref={lastFrameInputRef}
                        onChange={handleLastFrameUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {lastFrameImage ? (
                        <div className="relative group">
                          <img
                            src={lastFrameImage}
                            alt="Last frame"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setLastFrameImage("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                          onClick={() => lastFrameInputRef.current?.click()}
                        >
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                              <p className="text-xs text-muted-foreground">Upload last frame</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI will generate video content that transitions from first frame to last frame
                </p>
              </div>
            )}

            {/* Description with AI Enhancement */}
            <div className="space-y-2">
              <Label>Description</Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Describe what kind of content you want to generate..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !description.trim()}
                className="mt-2"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enhance with AI
                  </>
                )}
              </Button>
            </div>


            {/* Image-specific settings */}
            {workflowType === "image" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                        <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select 
                      value={duration} 
                      onValueChange={setDuration} 
                      disabled={generationMode === "reference-to-video"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {generationMode === "reference-to-video" ? (
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

                <div className="flex items-center justify-between space-x-2 py-2">
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
              </div>
            )}

            {/* Social Platforms Selection */}
            <div className="space-y-3">
              <Label>Publish to Social Platforms</Label>
              {socialPlatforms.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {socialPlatforms.map((platform) => (
                    <div
                      key={platform.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handlePlatformToggle(platform.id)}
                    >
                      <Checkbox
                        id={`platform-${platform.id}`}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`platform-${platform.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {platform.name}
                        </label>
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
            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">Schedule</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Times</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScheduleTimes([...scheduleTimes, "12:00"])}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Time
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {scheduleTimes.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...scheduleTimes];
                            newTimes[index] = e.target.value;
                            setScheduleTimes(newTimes);
                          }}
                          className="flex-1"
                        />
                        {scheduleTimes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setScheduleTimes(scheduleTimes.filter((_, i) => i !== index))}
                            className="h-9 w-9 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {(scheduleFrequency === "weekly" || scheduleFrequency === "custom") && (
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.id}
                        type="button"
                        variant={scheduleDays.includes(day.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDayToggle(day.id)}
                        className="w-12"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {scheduleFrequency === "once" && `Content will be generated and published once at ${scheduleTimes.join(', ')}.`}
                {scheduleFrequency === "daily" && `Content will be generated and published daily at ${scheduleTimes.join(', ')}.`}
                {scheduleFrequency === "weekly" && `Content will be generated and published weekly on selected days at ${scheduleTimes.join(', ')}.`}
                {scheduleFrequency === "custom" && `Content will be generated and published on ${scheduleDays.length} selected days at ${scheduleTimes.join(', ')}.`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveWorkflow} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingWorkflowId ? "Update Workflow" : "Create Workflow"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteWorkflowId} onOpenChange={(open) => !open && setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkflow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
