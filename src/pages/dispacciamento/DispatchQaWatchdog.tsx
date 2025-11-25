import DashboardLayout from "@/layouts/DashboardLayout";
import { AgentDashboard } from "@/components/dispacciamento/AgentDashboard";

export default function DispatchQaWatchdogPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AgentDashboard
          agentName="QA.WATCHDOG"
          agentDescription="Valida qualità dati e identifica anomalie nei profili"
        />
      </div>
    </DashboardLayout>
  );
}
