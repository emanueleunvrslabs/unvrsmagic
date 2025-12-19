import { DashboardLayout } from "@/components/dashboard-layout";
import { Switch } from "@/components/ui/switch";
import { useMarketplaceProjects } from "@/hooks/useMarketplaceProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Package, Eye, EyeOff, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";
import "@/components/labs/SocialMediaCard.css";

export default function AdminProjects() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const { allProjects, allLoading, togglePublished, toggleComingSoon } = useMarketplaceProjects();

  if (roleLoading || allLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isOwner) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Project Management</h1>
          <p className="text-white/60 mt-2">
            Manage projects and their visibility in the marketplace
          </p>
        </div>

        <div className="grid gap-4">
          {allProjects.map((project) => (
            <div 
              key={project.id}
              className="labs-client-card p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-white/80" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      {project.coming_soon ? (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Coming Soon
                        </Badge>
                      ) : project.published ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                          <Eye className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-white/10 text-white/50 border-white/20 hover:bg-white/15">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-white/50 mt-1">{project.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Coming Soon Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/60">Coming Soon</span>
                    <Switch
                      checked={project.coming_soon ?? false}
                      onCheckedChange={(checked) =>
                        toggleComingSoon.mutate({ id: project.id, coming_soon: checked })
                      }
                      disabled={toggleComingSoon.isPending}
                      className="data-[state=checked]:bg-amber-500/50"
                    />
                  </div>

                  {/* Published Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/60">
                      {project.published ? "Visible" : "Hidden"}
                    </span>
                    <Switch
                      checked={project.published}
                      onCheckedChange={(checked) =>
                        togglePublished.mutate({ id: project.id, published: checked })
                      }
                      disabled={togglePublished.isPending}
                      className="data-[state=checked]:bg-emerald-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {allProjects.length === 0 && (
          <div className="labs-client-card p-12 text-center">
            <Package className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50">No projects created</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}