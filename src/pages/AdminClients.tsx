import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { NewClientModal } from "@/components/admin/NewClientModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminClients() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const [modalOpen, setModalOpen] = useState(false);

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

        <div className="space-y-4">
          {clients && clients.length > 0 ? (
            clients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <CardTitle>{client.company_name}</CardTitle>
                  <CardDescription>
                    VAT: {client.vat_number} • {client.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Contact Persons:</p>
                    <div className="space-y-1">
                      {client.client_contacts.map((contact: any) => (
                        <div key={contact.id} className="text-sm text-muted-foreground">
                          {contact.first_name} {contact.last_name} • {contact.email} • {contact.whatsapp_number}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Clients Yet</CardTitle>
                <CardDescription>
                  Start by adding your first client using the "New Client" button above
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>

      <NewClientModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onSuccess={refetch}
      />
    </DashboardLayout>
  );
}
