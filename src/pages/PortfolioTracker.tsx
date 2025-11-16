import { PortfolioTrackerInterface } from "@/components/portfolio-tracker-interface/index";
import { DashboardLayout } from "@/components/dashboard-layout";


export const metadata = {
  title: "Portfolio Tracker | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

export default function PortfolioTrackerPage() {
  return (
    <DashboardLayout>
      <PortfolioTrackerInterface />
    </DashboardLayout>
  );
}
