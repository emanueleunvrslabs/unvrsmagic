import { DashboardLayout } from "@/components/dashboard-layout";
import { SocialCard } from "@/components/labs/SocialCard";

export default function LabsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <SocialCard />
      </div>
    </DashboardLayout>
  );
}
