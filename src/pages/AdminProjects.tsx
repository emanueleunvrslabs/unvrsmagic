import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMarketplaceProjects } from "@/hooks/useMarketplaceProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";

export default function AdminProjects() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const { allProjects, allLoading, togglePublished } = useMarketplaceProjects();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestione Progetti</h1>
            <p className="text-muted-foreground mt-2">
              Gestisci i progetti e la loro visibilità nel marketplace
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Progetto
          </Button>
        </div>

        <div className="space-y-4">
          {allProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {project.icon && <span className="text-2xl">{project.icon}</span>}
                      {project.name}
                      {project.published && (
                        <Badge variant="secondary">Pubblicato</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                    <p className="text-sm text-muted-foreground mt-2">
                      Route: <code className="bg-muted px-2 py-1 rounded">{project.route}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {project.published ? "Visibile nel marketplace" : "Nascosto"}
                      </span>
                      <Switch
                        checked={project.published}
                        onCheckedChange={(checked) =>
                          togglePublished.mutate({ id: project.id, published: checked })
                        }
                        disabled={togglePublished.isPending}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {allProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nessun progetto creato</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
