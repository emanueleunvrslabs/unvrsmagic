import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Calendar, Archive, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
};

export default function Projects() {
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  // Determine filter from URL
  const getFilterFromPath = () => {
    if (location.pathname === "/projects/active") return "active";
    if (location.pathname === "/projects/archived") return "archived";
    return "all";
  };

  const [filter, setFilter] = useState<"all" | "active" | "archived">(getFilterFromPath());

  // Update filter when URL changes
  useEffect(() => {
    setFilter(getFilterFromPath());
  }, [location.pathname]);

  // Fetch projects from database
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a project");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: newProject.name.trim(),
          description: newProject.description.trim() || null,
          user_id: user.id,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([data as Project, ...projects]);
      setNewProject({ name: "", description: "" });
      setIsModalOpen(false);
      toast.success("Project created successfully");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveProject = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    const newStatus = project.status === "active" ? "archived" : "active";

    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setProjects(
        projects.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      toast.success(`Project ${newStatus === "archived" ? "archived" : "restored"}`);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project status");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage your trading projects and strategies</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All Projects ({projects.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
          >
            Active ({projects.filter((p) => p.status === "active").length})
          </Button>
          <Button
            variant={filter === "archived" ? "default" : "outline"}
            onClick={() => setFilter("archived")}
          >
            Archived ({projects.filter((p) => p.status === "archived").length})
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className={cn(project.status === "archived" && "opacity-60")}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleArchiveProject(project.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{project.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      project.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {project.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {filter === "all"
                  ? "Create your first project to get started"
                  : `No ${filter} projects`}
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your trading strategies and bots.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
