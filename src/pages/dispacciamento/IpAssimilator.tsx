import DashboardLayout from "@/layouts/DashboardLayout";
import { SingleAgentConfig } from "@/components/dispacciamento/SingleAgentConfig";
import { Lightbulb } from "lucide-react";

export default function IpAssimilatorPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">IP.ASSIMILATOR</h1>
          <p className="text-muted-foreground mt-2">
            Costruisce profili giornalieri illuminazione pubblica (96 quarti d'ora)
          </p>
        </div>

        <SingleAgentConfig
          agent={{
            id: "IP.ASSIMILATOR",
            name: "IP.ASSIMILATOR",
            description: "Profili illuminazione pubblica",
            icon: Lightbulb,
            defaultPrompt: "Tu sei IP.ASSIMILATOR, l'agente che costruisce i profili dell'illuminazione pubblica...",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
