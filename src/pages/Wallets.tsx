import { WalletsInterface } from "@/components/wallets-interface/index";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Wallets | DefibotX",
  description: "Manage all your crypto wallets in one place",
};

export default function WalletsPage() {
  return (
    <DashboardLayout>
      <WalletsInterface />
    </DashboardLayout>
  );
}
