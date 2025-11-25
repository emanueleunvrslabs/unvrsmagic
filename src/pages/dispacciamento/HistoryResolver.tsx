import DashboardLayout from "@/layouts/DashboardLayout";
import { SingleAgentConfig } from "@/components/dispacciamento/SingleAgentConfig";
import { History } from "lucide-react";

export default function HistoryResolverPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">HISTORY.RESOLVER</h1>
          <p className="text-muted-foreground mt-2">
            Applica logica T-12 (storico anno precedente) per POD orari
          </p>
        </div>

        <SingleAgentConfig
          agent={{
            id: "HISTORY.RESOLVER",
            name: "HISTORY.RESOLVER",
            description: "Logica T-12 per POD orari",
            icon: History,
            defaultPrompt: "Tu sei HISTORY.RESOLVER, l'agente che applica la logica T-12 per i POD orari...",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
