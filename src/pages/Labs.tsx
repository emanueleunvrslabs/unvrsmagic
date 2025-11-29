import { DashboardLayout } from "@/components/dashboard-layout";
import { Window } from "@/components/labs/Window";

export default function LabsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <Window />
      </div>
    </DashboardLayout>
  );
}
