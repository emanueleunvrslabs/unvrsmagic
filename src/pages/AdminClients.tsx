import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { ClientCard } from "@/components/admin/ClientCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminClients() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get("project");

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          client_contacts (*),
          client_projects:client_projects (
            id,
            project_name,
            description
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Find selected project and its client
  const selectedProject = selectedProjectId
    ? clients?.flatMap((c) => 
        (c.client_projects || []).map(p => ({ ...p, client: c }))
      ).find((p) => p.id === selectedProjectId)
    : null;

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleBackToClients = () => {
    setSearchParams({});
  };

  if (roleLoading || isLoading) {
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

  // Show project detail view
  if (selectedProjectId && selectedProject) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToClients}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold">{selectedProject.project_name}</h1>
            {selectedProject.description && (
              <p className="text-muted-foreground mt-2">{selectedProject.description}</p>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="todo">Todo</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Client Information</h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Company: </span>
                    <span className="font-medium">{selectedProject.client.company_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">VAT: </span>
                    <span className="font-medium">{selectedProject.client.vat_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Address: </span>
                    <span className="font-medium">
                      {selectedProject.client.street}, {selectedProject.client.city} {selectedProject.client.postal_code}, {selectedProject.client.country}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Project Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {selectedProject.description || "No description provided"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workflow">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Project Workflow</h2>
                <p className="text-muted-foreground">Workflow management coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="invoice">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Invoices</h2>
                <p className="text-muted-foreground">Invoice management coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="document">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Documents</h2>
                <p className="text-muted-foreground">Document management coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="todo">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Todo List</h2>
                <p className="text-muted-foreground">Todo management coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="kanban">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Kanban Board</h2>
                <p className="text-muted-foreground">Kanban board coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

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
          <Button 
            onClick={() => setShowNewClientForm(true)} 
            className="gap-2 px-5 py-6 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
          >
            <UserPlus className="h-4 w-4" />
            New Client
          </Button>
        </div>

        <div className="flex flex-wrap gap-6 mx-auto" style={{ maxWidth: 'fit-content' }}>
          {showNewClientForm && (
            <ClientCard
              client={null}
              onEdit={() => {}}
              onContactAdded={refetch}
              clientProjects={[]}
              onCancel={() => setShowNewClientForm(false)}
              onClientCreated={() => setShowNewClientForm(false)}
            />
          )}
          
          {clients && clients.length > 0 ? (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEditClient}
                onContactAdded={refetch}
                clientProjects={client.client_projects || []}
              />
            ))
          ) : !showNewClientForm ? (
            <div className="text-center py-12 w-full">
              <p className="text-muted-foreground">
                No clients yet. Start by adding your first client using the "New Client" button above.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <EditClientModal
        client={selectedClient}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={refetch}
      />
    </DashboardLayout>
  );
}
