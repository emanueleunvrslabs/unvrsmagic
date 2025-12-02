import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
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
  const [promptTemplate, setPromptTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setWorkflowName("");
    setDescription("");
    setContentType("image");
    setPromptTemplate("");
  };

  const handleSave = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (!promptTemplate.trim()) {
      toast.error("Please enter a prompt template");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login first");
        return;
      }

      const { error } = await supabase
        .from('client_project_workflows')
        .insert({
          client_project_id: projectId,
          user_id: session.user.id,
          name: workflowName.trim(),
          description: description.trim() || null,
          content_type: contentType,
          prompt_template: promptTemplate.trim(),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism-modal max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white/90">New Workflow</DialogTitle>
          <DialogDescription className="text-white/60">
            Create an automated workflow for {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white/80">Workflow Name</Label>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter workflow name"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Content Type</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as "image" | "video")}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Prompt Template</Label>
            <Textarea
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="Enter the prompt template for content generation..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
            />
          </div>
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
