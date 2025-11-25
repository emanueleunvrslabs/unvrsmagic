import DashboardLayout from "@/layouts/DashboardLayout";
import { SingleAgentConfig } from "@/components/dispacciamento/SingleAgentConfig";
import { Shield } from "lucide-react";

export default function QaWatchdogPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">QA.WATCHDOG</h1>
          <p className="text-muted-foreground mt-2">
            Valida qualità dati e identifica anomalie
          </p>
        </div>

        <SingleAgentConfig
          agent={{
            id: "QA.WATCHDOG",
            name: "QA.WATCHDOG",
            description: "Validazione qualità e anomalie",
            icon: Shield,
            defaultPrompt: "Tu sei QA.WATCHDOG, l'agente responsabile della validazione qualità dati...",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
