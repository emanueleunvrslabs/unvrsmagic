import DashboardLayout from "@/layouts/DashboardLayout";
import { AgentDashboard } from "@/components/dispacciamento/AgentDashboard";

export default function DispatchExportHubPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AgentDashboard
          agentName="EXPORT.HUB"
          agentDescription="Genera file export JSON/CSV/XLSX e payload per UI"
        />
      </div>
    </DashboardLayout>
  );
}
