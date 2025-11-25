import { DashboardLayout } from "@/components/dashboard-layout";
import { CreditBalanceCard } from "@/components/ai-social/CreditBalanceCard";

export default function Wallet() {
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
