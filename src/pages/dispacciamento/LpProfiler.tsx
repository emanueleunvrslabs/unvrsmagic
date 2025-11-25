import DashboardLayout from "@/layouts/DashboardLayout";
import { SingleAgentConfig } from "@/components/dispacciamento/SingleAgentConfig";
import { BarChart3 } from "lucide-react";

export default function LpProfilerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">LP.PROFILER</h1>
          <p className="text-muted-foreground mt-2">
            Applica profili di carico per POD non orari
          </p>
        </div>

        <SingleAgentConfig
          agent={{
            id: "LP.PROFILER",
            name: "LP.PROFILER",
            description: "Profili di carico POD non orari",
            icon: BarChart3,
            defaultPrompt: "Tu sei LP.PROFILER, l'agente che applica i profili di carico per POD non orari...",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
