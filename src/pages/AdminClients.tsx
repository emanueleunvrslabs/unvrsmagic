import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { Navigate } from "react-router-dom";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { ClientCard } from "@/components/admin/ClientCard";
import { ProjectDetailCard } from "@/components/admin/ProjectDetailCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminClients() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    project_name: string;
    description?: string;
  } | null>(null);

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
        {selectedProject ? (
          <>
            <button
              onClick={() => setSelectedProject(null)}
              className="fixed top-6 left-[306px] z-50 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 shadow-lg shadow-white/5"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex justify-start">
              <ProjectDetailCard
                project={selectedProject}
                onClose={() => setSelectedProject(null)}
              />
            </div>
          </>
        ) : (
          <>
            <button 
              onClick={() => setShowNewClientForm(true)} 
              className="fixed top-6 left-[306px] z-50 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 shadow-lg shadow-white/5"
            >
              <UserPlus className="h-5 w-5" />
            </button>

            <div className="flex flex-wrap gap-6 mx-auto" style={{ maxWidth: 'fit-content' }}>
              {showNewClientForm && (
                <ClientCard
                  client={null}
                  onEdit={() => {}}
                  onContactAdded={refetch}
                  clientProjects={[]}
                  onCancel={() => setShowNewClientForm(false)}
                  onClientCreated={() => setShowNewClientForm(false)}
                  onProjectSelect={setSelectedProject}
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
                    onProjectSelect={setSelectedProject}
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
          </>
        )}
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
