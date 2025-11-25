import DashboardLayout from "@/layouts/DashboardLayout";
import { SingleAgentConfig } from "@/components/dispacciamento/SingleAgentConfig";
import { Brain } from "lucide-react";

export default function DispatchBrainPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">DISPATCH.BRAIN</h1>
          <p className="text-muted-foreground mt-2">
            Orchestratore centrale - coordina tutti gli agenti e gestisce il workflow
          </p>
        </div>

        <SingleAgentConfig
          agent={{
            id: "DISPATCH.BRAIN",
            name: "DISPATCH.BRAIN",
            description: "Orchestratore centrale del sistema di dispacciamento",
            icon: Brain,
            defaultPrompt: "Tu sei DISPATCH.BRAIN, l'orchestratore centrale del sistema di dispacciamento energia...",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
