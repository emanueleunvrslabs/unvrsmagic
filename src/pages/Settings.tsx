import { SettingsInterface } from "@/components/settings-interface/index";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Setting | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsInterface />
    </DashboardLayout>
  );
}
