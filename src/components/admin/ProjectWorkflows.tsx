import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Loader2, X, Pencil, Trash2, Upload, Clock, Play, Pause, Rocket } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface ProjectWorkflowsProps {
  projectId: string;
  projectName: string;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

export function ProjectWorkflows({ projectId, projectName }: ProjectWorkflowsProps) {
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Fetch workflows for this project
  const { data: workflows, refetch: refetchWorkflows } = useQuery({
    queryKey: ['client-project-workflows', projectId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('client_project_workflows')
        .select('*')
        .eq('client_project_id', projectId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

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

  const handleSaveWorkflow = async () => {
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
        prompt_template: description,
        platforms: selectedPlatforms,
        schedule_config: scheduleConfigData,
        active: true
      };

      if (editingWorkflowId) {
        const { error } = await supabase
          .from('client_project_workflows')
          .update(workflowData)
          .eq('id', editingWorkflowId);

        if (error) throw error;
        toast.success("Workflow updated successfully!");
      } else {
        const { error } = await supabase
          .from('client_project_workflows')
          .insert({
            client_project_id: projectId,
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

  const handleDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('client_project_workflows')
        .delete()
        .eq('id', deleteWorkflowId);

      if (error) throw error;

      toast.success("Workflow deleted successfully!");
      setDeleteWorkflowId(null);
      refetchWorkflows();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (workflowId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('client_project_workflows')
        .update({ active: !currentActive })
        .eq('id', workflowId);

      if (error) throw error;

      toast.success(currentActive ? "Workflow paused" : "Workflow activated");
      refetchWorkflows();
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Failed to update workflow");
    }
  };

  const resetForm = () => {
    setEditingWorkflowId(null);
    setWorkflowName("");
    setDescription("");
    setWorkflowType("image");
    setGenerationMode("text-to-image");
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

  const handleEditWorkflow = (workflow: any) => {
    setEditingWorkflowId(workflow.id);
    setWorkflowName(workflow.name || '');
    setWorkflowType(workflow.content_type);
    setGenerationMode(workflow.schedule_config?.generation_mode || (workflow.content_type === 'image' ? 'text-to-image' : 'text-to-video'));
    setDescription(workflow.description || '');
    setAspectRatio(workflow.schedule_config?.aspect_ratio || '1:1');
    setResolution(workflow.schedule_config?.resolution || '1K');
    setOutputFormat(workflow.schedule_config?.output_format || 'png');
    setSelectedPlatforms(workflow.platforms || []);
    setUploadedImages(workflow.schedule_config?.image_urls || []);
    setFirstFrameImage(workflow.schedule_config?.first_frame_image || '');
    setLastFrameImage(workflow.schedule_config?.last_frame_image || '');
    setDuration(workflow.schedule_config?.duration || '6s');
    setGenerateAudio(workflow.schedule_config?.generate_audio ?? true);
    setScheduleFrequency(workflow.schedule_config?.frequency || 'daily');
    setScheduleTimes(workflow.schedule_config?.times || ['09:00']);
    setScheduleDays(workflow.schedule_config?.days || ['monday', 'wednesday', 'friday']);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{projectName} - Workflows</h2>
          <p className="text-muted-foreground mt-1">
            Manage automated workflows for this project
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {/* Workflows Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows?.map((workflow) => (
          <Card key={workflow.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      workflow.content_type === 'image' 
                        ? 'bg-primary/20 text-primary border border-primary/30' 
                        : 'bg-secondary/20 text-secondary border border-secondary/30'
                    }`}>
                      {workflow.content_type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      workflow.active 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {workflow.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(workflow.id, workflow.active)}
                >
                  {workflow.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditWorkflow(workflow)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteWorkflowId(workflow.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Workflow Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWorkflowId ? "Edit Workflow" : "Create New Workflow"}</DialogTitle>
            <DialogDescription>
              Configure an automated workflow for {projectName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={workflowType} onValueChange={(value: "image" | "video") => handleWorkflowTypeChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description / Prompt</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description or prompt"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this workflow
                </p>
              </div>
              <Switch checked={true} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWorkflow} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingWorkflowId ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkflow} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
