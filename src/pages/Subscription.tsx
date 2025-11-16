import { SubscriptionInterface } from "@/components/subscription-interface/index";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Subscription | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

export default function SubscriptionPage() {
  return (
    <DashboardLayout>
      <SubscriptionInterface />
    </DashboardLayout>
  );
}
