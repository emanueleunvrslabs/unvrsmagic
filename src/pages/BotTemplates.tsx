import { BotTemplatesInterface } from "@/components/bot-templates-interface/index";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Bot Templates | DefibotX",
  description: "Browse, customize, and deploy trading bot templates for your crypto trading strategy",
};

export default function BotTemplatesPage() {
  return (
    <DashboardLayout>
      <BotTemplatesInterface />
    </DashboardLayout>
  );
}
