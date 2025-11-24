import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketplaceProjects } from "@/hooks/useMarketplaceProjects";
import { useUserProjects } from "@/hooks/useUserProjects";
import { Check, Plus, Loader2 } from "lucide-react";

export default function Marketplace() {
  const { projects, loading } = useMarketplaceProjects();
  const { userProjects, addProject, removeProject } = useUserProjects();

  const isProjectAdded = (projectId: string) => {
    return userProjects.some((up) => up.project_id === projectId);
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
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Scegli i progetti da aggiungere alla tua dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const added = isProjectAdded(project.id);
            
            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {project.icon && <span className="text-2xl">{project.icon}</span>}
                      {project.name}
                    </CardTitle>
                    {added && (
                      <Badge variant="secondary" className="ml-2">
                        <Check className="h-3 w-3 mr-1" />
                        Aggiunto
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1" />

                <CardFooter>
                  {added ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => removeProject.mutate(project.id)}
                      disabled={removeProject.isPending}
                    >
                      {removeProject.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Rimuovi dalla Dashboard
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => addProject.mutate(project.id)}
                      disabled={addProject.isPending}
                    >
                      {addProject.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Aggiungi alla Dashboard
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nessun progetto disponibile al momento
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
