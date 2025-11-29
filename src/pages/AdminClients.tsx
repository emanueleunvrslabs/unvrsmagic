import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { ClientCard } from "@/components/admin/ClientCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminClients() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

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

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setEditModalOpen(true);
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

        <div className="flex flex-wrap gap-6">
          {showNewClientForm && (
            <ClientCard
              client={null}
              onEdit={() => {}}
              onContactAdded={refetch}
              clientProjects={[]}
              onCancel={() => setShowNewClientForm(false)}
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
