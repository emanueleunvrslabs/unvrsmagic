import { useState } from "react";
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
import { Package, Plus, Calendar, Archive, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  createdAt: Date;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Trading Bot v1",
      description: "Automated trading bot for crypto markets",
      status: "active",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "DCA Strategy",
      description: "Dollar cost averaging implementation",
      status: "active",
      createdAt: new Date("2024-02-01"),
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");

  const handleCreateProject = () => {
    if (!newProject.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      status: "active",
      createdAt: new Date(),
    };

    setProjects([project, ...projects]);
    setNewProject({ name: "", description: "" });
    setIsModalOpen(false);
    toast.success("Project created successfully");
  };

  const handleArchiveProject = (id: string) => {
    setProjects(
      projects.map((p) =>
        p.id === id ? { ...p, status: p.status === "active" ? "archived" : "active" } : p
      )
    );
    toast.success("Project status updated");
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    toast.success("Project deleted");
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

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
                    {project.createdAt.toLocaleDateString()}
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
                Create your first project to get started
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
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
