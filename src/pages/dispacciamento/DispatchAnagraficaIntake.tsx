import DashboardLayout from "@/layouts/DashboardLayout";
import { AgentDashboard } from "@/components/dispacciamento/AgentDashboard";

export default function DispatchAnagraficaIntakePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AgentDashboard
          agentName="ANAGRAFICA.INTAKE"
          agentDescription="Normalizza e valida i dati anagrafici dei POD da file CSV/XML"
        />
      </div>
    </DashboardLayout>
  );
}
