import DashboardLayout from "@/layouts/DashboardLayout";
import { AgentDashboard } from "@/components/dispacciamento/AgentDashboard";

export default function DispatchHistoryResolverPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AgentDashboard
          agentName="HISTORY.RESOLVER"
          agentDescription="Applica logica T-12 per POD orari usando dati storici"
        />
      </div>
    </DashboardLayout>
  );
}
