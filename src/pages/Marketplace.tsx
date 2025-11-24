import { DashboardLayout } from "@/components/dashboard-layout";
import { useMarketplaceProjects } from "@/hooks/useMarketplaceProjects";
import { useUserProjects } from "@/hooks/useUserProjects";
import { Loader2 } from "lucide-react";
import { ProjectCard } from "@/components/marketplace/project-card";
import { StrategyDetailsModal } from "@/components/strategies-marketplace-interface/components/strategy-details-modal";
import { useState } from "react";
import type { Strategy } from "@/components/strategies-marketplace-interface/types";

export default function Marketplace() {
  const { projects, loading } = useMarketplaceProjects();
  const { userProjects, addProject, removeProject } = useUserProjects();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isProjectAdded = (projectId: string) => {
    return userProjects.some((up) => up.project_id === projectId);
  };

  // Convert project to strategy format for the modal
  const convertProjectToStrategy = (project: any): Strategy => {
    return {
      id: project.id,
      name: project.name,
      description: project.description || "No description available",
      category: "AI-Powered",
      price: 0,
      isFree: true,
      rating: 5,
      reviews: 0,
      purchases: userProjects.length,
      winRate: 100,
      returns: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
      risk: "Low" as const,
      creator: {
        id: "defibotx",
        name: "DefibotX",
        verified: true,
        avatar: project.icon || "🤖",
        strategies: projects.length,
        followers: 0
      },
      tags: ["Project", "Dashboard", "Free"],
      isFavorite: false,
      isPurchased: isProjectAdded(project.id),
      isNew: false,
      isTrending: false,
      isFeatured: false,
      maxDrawdown: 0,
      profitFactor: 1,
      timeInMarket: 100,
      tradesPerDay: 0,
      supportedExchanges: ["Bitget", "Binance", "OKX"],
      supportedPairs: ["BTC/USDT", "ETH/USDT"],
      lastUpdated: new Date().toISOString(),
      chartData: {
        "1D": [],
        "1W": [],
        "1M": [],
        "3M": [],
        "6M": [],
        "1Y": [],
        "All": []
      }
    };
  };

  const handleViewDetails = (project: any) => {
    const strategy = convertProjectToStrategy(project);
    setSelectedStrategy(strategy);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStrategy(null);
  };

  const handlePurchase = (strategyId: string) => {
    const project = projects.find(p => p.id === strategyId);
    if (project) {
      if (isProjectAdded(strategyId)) {
        removeProject.mutate(strategyId);
      } else {
        addProject.mutate(strategyId);
      }
    }
    handleCloseModal();
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

      <StrategyDetailsModal
        strategy={selectedStrategy}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onToggleFavorite={() => {}}
        onPurchase={handlePurchase}
      />
    </DashboardLayout>
  );
}
