import { DashboardLayout } from "@/components/dashboard-layout";
import { CreditCard } from "@/components/wallet/CreditCard";

export default function Wallet() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen p-8">
        <CreditCard />
      </div>
    </DashboardLayout>
  );
}
