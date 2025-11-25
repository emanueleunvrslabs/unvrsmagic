import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Loader2, X, Pencil, Trash2, Upload, Clock, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  const [description, setDescription] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
        setEnhancedPrompt(data.enhancedPrompt);
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
    // Clear uploaded images when changing type
    setUploadedImages([]);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const newImageUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('ai-social-uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ai-social-uploads')
          .getPublicUrl(fileName);

        newImageUrls.push(publicUrl);
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

  const handleSaveWorkflow = async () => {
    const finalPrompt = enhancedPrompt || description;
    
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

      const workflowData = {
        name: `${workflowType === 'image' ? 'Image' : 'Video'} Workflow - ${generationMode}`,
        description: description,
        content_type: workflowType,
        prompt_template: finalPrompt,
        platforms: selectedPlatforms,
        schedule_config: {
          generation_mode: generationMode,
          aspect_ratio: aspectRatio,
          resolution: resolution,
          output_format: outputFormat,
          image_urls: uploadedImages,
          frequency: scheduleFrequency,
          times: scheduleTimes,
          days: scheduleDays
        },
        active: true
      };

      if (editingWorkflowId) {
        // Update existing workflow
        const { error } = await supabase
          .from('ai_social_workflows')
          .update(workflowData)
          .eq('id', editingWorkflowId);

        if (error) throw error;
        toast.success("Workflow updated successfully!");
      } else {
        // Create new workflow
        const { error } = await supabase
          .from('ai_social_workflows')
          .insert({
            user_id: session.user.id,
            ...workflowData
          });

        if (error) throw error;
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
    setWorkflowType(workflow.content_type);
    setGenerationMode(workflow.schedule_config?.generation_mode || (workflow.content_type === 'image' ? 'text-to-image' : 'text-to-video'));
    setDescription(workflow.description || '');
    setEnhancedPrompt(workflow.prompt_template || '');
    setAspectRatio(workflow.schedule_config?.aspect_ratio || '1:1');
    setResolution(workflow.schedule_config?.resolution || '1K');
    setOutputFormat(workflow.schedule_config?.output_format || 'png');
    setSelectedPlatforms(workflow.platforms || []);
    setUploadedImages(workflow.schedule_config?.image_urls || []);
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
      const { error } = await supabase
        .from('ai_social_workflows')
        .update({ active: !currentActive })
        .eq('id', workflowId);

      if (error) throw error;
      toast.success(currentActive ? "Workflow paused" : "Workflow activated");
      refetchWorkflows();
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Failed to update workflow status");
    }
  };

  const resetForm = () => {
    setEditingWorkflowId(null);
    setWorkflowType("image");
    setGenerationMode("text-to-image");
    setDescription("");
    setEnhancedPrompt("");
    setAspectRatio("1:1");
    setResolution("1K");
    setOutputFormat("png");
    setSelectedPlatforms([]);
    setUploadedImages([]);
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

  const openNewWorkflowDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', connected: connectedAccounts?.some(a => a.provider === 'instagram') },
    { id: 'facebook', name: 'Facebook', connected: connectedAccounts?.some(a => a.provider === 'facebook') },
    { id: 'twitter', name: 'Twitter', connected: connectedAccounts?.some(a => a.provider === 'twitter') },
    { id: 'linkedin', name: 'LinkedIn', connected: connectedAccounts?.some(a => a.provider === 'linkedin') },
  ];

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
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground">{workflow.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              {workflow.content_type}
                            </span>
                            {workflow.platforms?.map((platform: string) => (
                              <span key={platform} className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${workflow.active ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                            {workflow.active ? 'Active' : 'Paused'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleWorkflowActive(workflow.id, workflow.active)}
                            title={workflow.active ? "Pause workflow" : "Activate workflow"}
                          >
                            {workflow.active ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditWorkflow(workflow)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteWorkflowId(workflow.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                <Select value={generationMode} onValueChange={setGenerationMode}>
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

            {/* Enhanced Prompt Preview */}
            {enhancedPrompt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Enhanced Prompt</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEnhancedPrompt("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  {enhancedPrompt}
                </div>
              </div>
            )}

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
              <div className="grid grid-cols-2 gap-4">
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
            )}

            {/* Social Platforms Selection */}
            <div className="space-y-3">
              <Label>Publish to Social Platforms</Label>
              <div className="grid grid-cols-2 gap-3">
                {socialPlatforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      platform.connected 
                        ? 'border-border hover:bg-muted/50 cursor-pointer' 
                        : 'border-border/50 opacity-50'
                    }`}
                    onClick={() => platform.connected && handlePlatformToggle(platform.id)}
                  >
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      disabled={!platform.connected}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={platform.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {platform.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {platform.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {socialPlatforms.every(p => !p.connected) && (
                <p className="text-sm text-muted-foreground">
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
