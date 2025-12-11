import { DashboardLayout } from "@/components/dashboard-layout";
import { useMarketplaceProjects, MarketplaceProject } from "@/hooks/useMarketplaceProjects";
import { useUserProjects } from "@/hooks/useUserProjects";
import { Loader2 } from "lucide-react";
import { ProjectCard } from "@/components/marketplace/project-card";
import { ProjectDetailsModal } from "@/components/marketplace/project-details-modal";
import { useState } from "react";

export default function Marketplace() {
  const { projects, loading } = useMarketplaceProjects();
  const { userProjects, addProject, removeProject } = useUserProjects();
  const [selectedProject, setSelectedProject] = useState<MarketplaceProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isProjectAdded = (projectId: string) => {
    return userProjects.some((up) => up.project_id === projectId);
  };

  const handleViewDetails = (project: MarketplaceProject) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleAddProject = () => {
    if (selectedProject) {
      addProject.mutate(selectedProject.id);
    }
  };

  const handleRemoveProject = () => {
    if (selectedProject) {
      removeProject.mutate(selectedProject.id);
      handleCloseModal();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and add projects to your personal dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isAdded={isProjectAdded(project.id)}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No projects available at the moment
            </p>
          </div>
        )}
      </div>

      <ProjectDetailsModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isAdded={selectedProject ? isProjectAdded(selectedProject.id) : false}
        onAddProject={handleAddProject}
        onRemoveProject={handleRemoveProject}
        isLoading={addProject.isPending || removeProject.isPending}
      />
    </DashboardLayout>
  );
}
