import { DashboardLayout } from "@/components/dashboard-layout";
import { CreditCard } from "@/components/wallet/CreditCard";
import { TransactionsList } from "@/components/wallet/TransactionsList";

export default function Wallet() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center gap-6 pt-16 p-8">
        <CreditCard />
        <TransactionsList />
      </div>
    </DashboardLayout>
  );
}
