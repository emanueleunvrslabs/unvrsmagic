import { DashboardLayout } from "@/components/dashboard-layout";
import { CreditCard } from "@/components/wallet/CreditCard";

export default function Wallet() {
  return (
    <DashboardLayout>
      <div className="flex justify-center pt-16 p-8">
        <CreditCard />
      </div>
    </DashboardLayout>
  );
}
