import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { NewClientModal } from "@/components/admin/NewClientModal";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { ClientCard } from "@/components/admin/ClientCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/social-card.css";

export default function AdminClients() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          client_contacts (*)
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
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Client
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {clients && clients.length > 0 ? (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEditClient}
                isOpen={openClientId === client.id}
                onToggle={(open) => setOpenClientId(open ? client.id : null)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No clients yet. Start by adding your first client using the "New Client" button above.
              </p>
            </div>
          )}
        </div>

        <div className="social-card-container mt-8">
          <div className="social-card">
            <ul>
              <li className="social-iso-pro">
                <span></span>
                <span></span>
                <span></span>
                <a href="#">
                  <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="social-svg"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </a>
                <div className="social-text">Projects</div>
              </li>
              <li className="social-iso-pro">
                <span></span>
                <span></span>
                <span></span>
                <a href="#">
                  <svg
                    className="social-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </a>
                <div className="social-text">Contact</div>
              </li>
              <li className="social-iso-pro">
                <span></span>
                <span></span>
                <span></span>
                <a href="#">
                  <svg
                    className="social-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </a>
                <div className="social-text">Edit</div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <NewClientModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onSuccess={refetch}
      />

      <EditClientModal
        client={selectedClient}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={refetch}
      />
    </DashboardLayout>
  );
}
