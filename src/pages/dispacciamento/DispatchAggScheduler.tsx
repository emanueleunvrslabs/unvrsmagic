import DashboardLayout from "@/layouts/DashboardLayout";
import { AgentDashboard } from "@/components/dispacciamento/AgentDashboard";

export default function DispatchAggSchedulerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AgentDashboard
          agentName="AGG.SCHEDULER"
          agentDescription="Aggrega curve IP, O e LP in curva totale a 96 valori"
        />
      </div>
    </DashboardLayout>
  );
}
