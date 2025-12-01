import "../labs/SocialMediaCard.css";
import { GitBranch, FileText, CheckSquare, Kanban, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  project_name: string;
  description?: string;
}

interface ProjectsCardProps {
  clientId: string;
  projects: Project[];
  onProjectUpdated: () => void;
}

const projectSchema = z.object({
  projectName: z.string().trim().min(1, "Project name is required").max(200),
});

export function ProjectsCard({ 
  clientId, 
  projects, 
  onProjectUpdated
}: ProjectsCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newProject, setNewProject] = useState({
    projectName: ""
  });
  const [editProject, setEditProject] = useState({
    projectName: ""
  });

  const handleAutoSaveProject = async () => {
    if (!newProject.projectName.trim()) {
      return;
    }

    try {
      const validated = projectSchema.parse(newProject);

      const { error } = await supabase
        .from("client_projects")
        .insert({
          client_id: clientId,
          project_name: validated.projectName,
        });

      if (error) throw error;

      setNewProject({ projectName: "" });
      setShowAddProject(false);
      onProjectUpdated();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add project",
          variant: "destructive",
        });
      }
    }
  };

  const handleAutoUpdateProject = async (projectId: string) => {
    if (!editProject.projectName.trim()) {
      return;
    }

    try {
      const validated = projectSchema.parse(editProject);

      const { error } = await supabase
        .from("client_projects")
        .update({
          project_name: validated.projectName,
        })
        .eq("id", projectId);

      if (error) throw error;

      setEditingProjectId(null);
      onProjectUpdated();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update project",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("client_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      setEditingProjectId(null);
      onProjectUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const startEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProject({
      projectName: project.project_name,
    });
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/admin/clients?project=${projectId}`);
  };

  return (
    <div className="client-card-wrapper">
      <div className="social-media-card expanded-lateral">
        <div className="contacts-section-lateral open">
          <div className="flex justify-center mb-3">
            <button
              className="text-xs text-purple-400/70 hover:text-purple-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddProject(!showAddProject);
              }}
            >
              {showAddProject ? "Cancel" : "Add Project"}
            </button>
          </div>
          
          {showAddProject ? (
            <div className="flex flex-col gap-3 w-full">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Project Name</label>
                <input 
                  type="text"
                  value={newProject.projectName}
                  onChange={(e) => setNewProject({...newProject, projectName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderRadius: '12px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAutoSaveProject();
                }}
                disabled={isSaving || !newProject.projectName}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : editingProjectId ? (
            <div className="flex flex-col gap-3 w-full">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Project Name</label>
                <input 
                  type="text"
                  value={editProject.projectName}
                  onChange={(e) => setEditProject({...editProject, projectName: e.target.value})}
                  onBlur={() => handleAutoUpdateProject(editingProjectId!)}
                  className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderRadius: '12px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: '12px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(editingProjectId);
                  }}
                  disabled={deleting}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-3 py-2 text-xs transition-colors"
                  style={{ borderRadius: '12px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProjectId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            projects.length > 0 ? (
              <>
                {projects.map((project, index) => (
                  <div 
                    key={project.id} 
                    className="social-icons contact-item-stagger cursor-pointer justify-between"
                    style={{ animationDelay: `${index * 0.08}s` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditProject(project);
                    }}
                  >
                    <span className="contact-name-card">{project.project_name}</span>
                    <div className="flex gap-2">
                      <button
                        className="instagram-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectClick(project.id);
                        }}
                        aria-label="Workflow"
                        title="Workflow"
                      >
                        <GitBranch className="icon" strokeWidth={2} />
                      </button>
                      <button
                        className="x-link"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        aria-label="Document"
                        title="Document"
                      >
                        <FileText className="icon" strokeWidth={2} />
                      </button>
                      <button
                        className="discord-link"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        aria-label="Todo"
                        title="Todo"
                      >
                        <CheckSquare className="icon" strokeWidth={2} />
                      </button>
                      <button
                        className="instagram-link"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        aria-label="Kanban"
                        title="Kanban"
                      >
                        <Kanban className="icon" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No projects yet
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}