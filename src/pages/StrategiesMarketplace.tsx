import { StrategiesMarketplaceInterface } from "@/components/strategies-marketplace-interface/index";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Strategies Marketplace | DefibotX",
  description: "Browse, purchase, and manage AI-powered trading strategies for crypto markets",
};

export default function StrategiesMarketplacePage() {
  return (
    <DashboardLayout>
      <StrategiesMarketplaceInterface />
    </DashboardLayout>
  );
}
