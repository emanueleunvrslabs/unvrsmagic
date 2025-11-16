import { DcaBotDashboard } from "@/components/dca-bot-dashboard/index";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Dca Bot | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

export default function DcaBotPage() {
  return (
    <DashboardLayout>
      <DcaBotDashboard />
    </DashboardLayout>
  );
}
