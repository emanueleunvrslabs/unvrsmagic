import "../labs/SocialMediaCard.css";
import { GitBranch, Receipt, FileText, CheckSquare, Kanban, X, Plus, Play, Pause, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ClientWorkflowDialog } from "./ClientWorkflowDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Workflow {
  id: string;
  name: string;
  content_type: string;
  active: boolean;
  schedule_config: any;
}

interface ProjectDetailCardProps {
  project: {
    id: string;
    project_name: string;
    description?: string;
  };
  onClose: () => void;
}

export function ProjectDetailCard({ project, onClose }: ProjectDetailCardProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('client_project_workflows')
      .select('id, name, content_type, active, schedule_config')
      .eq('client_project_id', project.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workflows:', error);
    } else {
      setWorkflows(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activePanel === 'workflow') {
      fetchWorkflows();
    }
  }, [activePanel, project.id]);

  const togglePanel = (panel: string) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };

  const handleToggleActive = async (workflowId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('client_project_workflows')
      .update({ active: !currentActive })
      .eq('id', workflowId);

    if (error) {
      toast({ title: "Error updating workflow", variant: "destructive" });
    } else {
      fetchWorkflows();
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    const { error } = await supabase
      .from('client_project_workflows')
      .delete()
      .eq('id', workflowId);

    if (error) {
      toast({ title: "Error deleting workflow", variant: "destructive" });
    } else {
      toast({ title: "Workflow deleted" });
      fetchWorkflows();
    }
  };

  const getModeLabel = (config: any) => {
    const mode = config?.mode || config?.generationMode;
    if (!mode) return null;
    const labels: Record<string, string> = {
      'text-to-image': 'Text to Image',
      'image-to-image': 'Image to Image',
      'text-to-video': 'Text to Video',
      'image-to-video': 'Image to Video',
      'reference-to-video': 'Reference to Video',
      'first-last-frame': 'First/Last Frame'
    };
    return labels[mode] || mode;
  };

  return (
    <>
    <div className="flex gap-4 items-start">
      {/* Main Project Card */}
      <div className="client-card-wrapper">
        <div className="social-media-card group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-all"
            aria-label="Close project"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
          
          <div className="card-main-content">
            <img
              src="https://uiverse.io/astronaut.png"
              alt="Project"
              className="astronaut-image"
            />
            <div className="card-heading">
              {project.project_name}
            </div>
            
            <div className="social-icons">
              <button 
                className="instagram-link"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePanel('workflow');
                }}
                title="Workflow"
              >
                <GitBranch className="icon" strokeWidth={2} />
              </button>
              <button 
                className="x-link"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePanel('invoice');
                }}
                title="Invoice"
              >
                <Receipt className="icon" strokeWidth={2} />
              </button>
              <button 
                className="discord-link"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePanel('documents');
                }}
                title="Documents"
              >
                <FileText className="icon" strokeWidth={2} />
              </button>
              <button 
                className="instagram-link"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePanel('todo');
                }}
                title="Todo"
              >
                <CheckSquare className="icon" strokeWidth={2} />
              </button>
              <button 
                className="x-link"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePanel('kanban');
                }}
                title="Kanban"
              >
                <Kanban className="icon" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Separate Panel Card */}
      {activePanel && (
        <div className="client-card-wrapper">
          <div className="social-media-card group" style={{ width: '28em' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePanel(null);
              }}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-all"
              aria-label="Close panel"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="card-main-content !justify-start !pt-12 h-full" style={{ width: '28em' }}>
              {activePanel === 'workflow' && (
                <div className="flex flex-col gap-4 w-full h-full">
                  <div className="flex-1">
                    <div className="card-heading text-lg">Workflow</div>
                    <p className="text-xs text-white/60 mt-2">Manage project workflows and automation.</p>
                    
                    <div className="mt-4">
                      {isLoading ? (
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-xs text-white/70">Loading...</span>
                        </div>
                      ) : workflows.length === 0 ? (
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-xs text-white/70">No workflows configured yet</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                          {workflows.map((workflow) => (
                            <div 
                              key={workflow.id}
                              className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white/90 truncate">{workflow.name}</div>
                                <div className="flex gap-1 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary/80 border border-primary/30">
                                {workflow.content_type}
                              </span>
                              {getModeLabel(workflow.schedule_config) && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 border border-white/20">
                                  {getModeLabel(workflow.schedule_config)}
                                </span>
                              )}
                                </div>
                              </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => console.log('Run workflow:', workflow.id)}
                              className="p-1.5 rounded text-primary/70 hover:text-primary hover:bg-primary/10"
                              title="Run Now"
                            >
                              <Play size={14} fill="currentColor" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(workflow.id, workflow.active)}
                              className={`p-1.5 rounded ${workflow.active ? 'text-green-400 hover:bg-green-400/10' : 'text-white/40 hover:bg-white/10'}`}
                              title={workflow.active ? 'Pause' : 'Activate'}
                            >
                              {workflow.active ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteWorkflow(workflow.id)}
                              className="p-1.5 rounded text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setIsWorkflowDialogOpen(true)}
                    className="bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 w-full mt-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Workflow
                  </Button>
                </div>
              )}
              
              {activePanel === 'invoice' && (
                <div className="flex flex-col gap-4 w-full">
                  <div className="card-heading text-lg">Invoice</div>
                  <p className="text-xs text-white/60">View and manage project invoices.</p>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs text-white/70">No invoices yet</span>
                  </div>
                </div>
              )}
              
              {activePanel === 'documents' && (
                <div className="flex flex-col gap-4 w-full">
                  <div className="card-heading text-lg">Documents</div>
                  <p className="text-xs text-white/60">Project documentation and files.</p>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs text-white/70">No documents yet</span>
                  </div>
                </div>
              )}
              
              {activePanel === 'todo' && (
                <div className="flex flex-col gap-4 w-full">
                  <div className="card-heading text-lg">Todo</div>
                  <p className="text-xs text-white/60">Track project tasks and to-dos.</p>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs text-white/70">No tasks yet</span>
                  </div>
                </div>
              )}
              
              {activePanel === 'kanban' && (
                <div className="flex flex-col gap-4 w-full">
                  <div className="card-heading text-lg">Kanban</div>
                  <p className="text-xs text-white/60">Visual project board management.</p>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs text-white/70">No boards yet</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    
    <ClientWorkflowDialog
      open={isWorkflowDialogOpen}
      onOpenChange={setIsWorkflowDialogOpen}
      projectId={project.id}
      projectName={project.project_name}
      onWorkflowCreated={fetchWorkflows}
    />
  </>
  );
}
