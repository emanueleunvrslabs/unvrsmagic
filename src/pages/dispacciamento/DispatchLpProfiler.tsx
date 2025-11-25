import DashboardLayout from "@/layouts/DashboardLayout";
import { AgentDashboard } from "@/components/dispacciamento/AgentDashboard";

export default function DispatchLpProfilerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AgentDashboard
          agentName="LP.PROFILER"
          agentDescription="Applica load profile per POD non orari secondo categorie"
        />
      </div>
    </DashboardLayout>
  );
}
