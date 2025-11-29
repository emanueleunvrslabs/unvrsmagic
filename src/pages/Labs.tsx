import { DashboardLayout } from "@/components/dashboard-layout";
import { GlassCards } from "@/components/labs/GlassCards";

export default function LabsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <GlassCards />
      </div>
    </DashboardLayout>
  );
}
