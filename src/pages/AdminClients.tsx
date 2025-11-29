import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminClients() {
  const { isOwner, loading: roleLoading } = useUserRole();

  if (roleLoading) {
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

  const handleNewClient = () => {
    // TODO: Implement new client modal/form
    console.log("New client clicked");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your clients and their access to projects
            </p>
          </div>
          <Button onClick={handleNewClient} className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Client
          </Button>
        </div>

        <div className="space-y-4">
          {/* Client list will go here */}
          <Card>
            <CardHeader>
              <CardTitle>No Clients Yet</CardTitle>
              <CardDescription>
                Start by adding your first client using the "New Client" button above
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
