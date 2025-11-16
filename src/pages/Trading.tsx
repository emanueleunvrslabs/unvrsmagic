import { TradingInterface } from "@/components/trading-interface/index";
import { DashboardLayout } from "@/components/dashboard-layout";


export const metadata = {
  title: "Trading | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

export default function TradingPage() {
  return (
    <DashboardLayout>
      <TradingInterface />
    </DashboardLayout>
  );
}
