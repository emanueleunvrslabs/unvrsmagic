import DashboardLayout from "@/layouts/DashboardLayout";
import { SingleAgentConfig } from "@/components/dispacciamento/SingleAgentConfig";
import { Database } from "lucide-react";

export default function AnagraficaIntakePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">ANAGRAFICA.INTAKE</h1>
          <p className="text-muted-foreground mt-2">
            Normalizza e valida i dati POD dall'anagrafica
          </p>
        </div>

        <SingleAgentConfig
          agent={{
            id: "ANAGRAFICA.INTAKE",
            name: "ANAGRAFICA.INTAKE",
            description: "Normalizzazione e validazione dati POD",
            icon: Database,
            defaultPrompt: "Tu sei ANAGRAFICA.INTAKE, l'agente responsabile della normalizzazione dei dati POD...",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
