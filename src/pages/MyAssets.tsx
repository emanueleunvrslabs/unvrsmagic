import { MyAssets } from "@/components/my-assets/index";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "My Assets | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

export default function MyAssetsPage() {
  return (
    <DashboardLayout>
      <MyAssets />
    </DashboardLayout>
  );
}
