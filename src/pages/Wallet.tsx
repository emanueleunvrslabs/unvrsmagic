import { DashboardLayout } from "@/components/dashboard-layout";
import { CreditBalanceCard } from "@/components/ai-social/CreditBalanceCard";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

export default function Wallet() {
  const { isOwner, isAdmin, loading } = useUserRole();

  // Wallet is only for regular users, not for owners/admins
  if (loading) {
    return null;
  }

  if (isOwner || isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground mt-2">
            Manage your credits and view transaction history
          </p>
        </div>

        <CreditBalanceCard />
      </div>
    </DashboardLayout>
  );
}
