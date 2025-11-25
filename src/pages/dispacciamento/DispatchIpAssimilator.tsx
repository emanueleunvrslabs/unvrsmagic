import DashboardLayout from "@/layouts/DashboardLayout";
import { AgentDashboard } from "@/components/dispacciamento/AgentDashboard";

export default function DispatchIpAssimilatorPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AgentDashboard
          agentName="IP.ASSIMILATOR"
          agentDescription="Costruisce profili giornalieri dell'illuminazione pubblica a 96 quarti d'ora"
        />
      </div>
    </DashboardLayout>
  );
}
