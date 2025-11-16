import { OverviewDashboard } from "@/components/overview-dashboard/index";
import { DashboardLayout } from "@/components/dashboard-layout";


export const metadata = {
  title: "Overview | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

export default function OverviewPage() {
  return (
    <DashboardLayout>
      <OverviewDashboard />
    </DashboardLayout>
  );
}
