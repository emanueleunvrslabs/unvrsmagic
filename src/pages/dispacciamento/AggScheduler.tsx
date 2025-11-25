import DashboardLayout from "@/layouts/DashboardLayout";
import { SingleAgentConfig } from "@/components/dispacciamento/SingleAgentConfig";
import { Calendar } from "lucide-react";

export default function AggSchedulerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AGG.SCHEDULER</h1>
          <p className="text-muted-foreground mt-2">
            Combina tutte le fonti dati e aggrega le curve
          </p>
        </div>

        <SingleAgentConfig
          agent={{
            id: "AGG.SCHEDULER",
            name: "AGG.SCHEDULER",
            description: "Aggregazione curve e fonti dati",
            icon: Calendar,
            defaultPrompt: "Tu sei AGG.SCHEDULER, l'agente che combina e aggrega tutte le curve...",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
