import DashboardLayout from "@/layouts/DashboardLayout";
import { SingleAgentConfig } from "@/components/dispacciamento/SingleAgentConfig";
import { FileOutput } from "lucide-react";

export default function ExportHubPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">EXPORT.HUB</h1>
          <p className="text-muted-foreground mt-2">
            Genera file di output (JSON/CSV/XLSX) e payload per UI
          </p>
        </div>

        <SingleAgentConfig
          agent={{
            id: "EXPORT.HUB",
            name: "EXPORT.HUB",
            description: "Generazione file output",
            icon: FileOutput,
            defaultPrompt: "Tu sei EXPORT.HUB, l'agente che genera i file di output finali...",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
