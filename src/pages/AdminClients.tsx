import { DashboardLayout } from "@/components/dashboard-layout";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { AppleTVClientsDemo } from "@/components/labs/AppleTVClientsDemo";

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

  return (
    <DashboardLayout>
      <AppleTVClientsDemo />
    </DashboardLayout>
  );
}
