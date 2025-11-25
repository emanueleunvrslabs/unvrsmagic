import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Brain, Database, Lightbulb, History, BarChart3, Calendar, Shield, FileOutput } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AGENTS = [
  {
    id: "DISPATCH.BRAIN",
    name: "DISPATCH.BRAIN",
    description: "Orchestratore centrale - coordina tutti gli agenti e gestisce il workflow",
    icon: Brain,
    defaultPrompt: "Tu sei DISPATCH.BRAIN, l'orchestratore centrale del sistema di dispacciamento energia..."
  },
  {
    id: "ANAGRAFICA.INTAKE",
    name: "ANAGRAFICA.INTAKE",
    description: "Normalizza e valida i dati POD dall'anagrafica",
    icon: Database,
    defaultPrompt: "Tu sei ANAGRAFICA.INTAKE, l'agente responsabile della normalizzazione dei dati POD..."
  },
  {
    id: "IP.ASSIMILATOR",
    name: "IP.ASSIMILATOR",
    description: "Costruisce profili giornalieri illuminazione pubblica (96 quarti d'ora)",
    icon: Lightbulb,
    defaultPrompt: "Tu sei IP.ASSIMILATOR, l'agente che costruisce i profili dell'illuminazione pubblica..."
  },
  {
    id: "HISTORY.RESOLVER",
    name: "HISTORY.RESOLVER",
    description: "Applica logica T-12 (storico anno precedente) per POD orari",
    icon: History,
    defaultPrompt: "Tu sei HISTORY.RESOLVER, l'agente che applica la logica T-12 per i POD orari..."
  },
  {
    id: "LP.PROFILER",
    name: "LP.PROFILER",
    description: "Applica profili di carico per POD non orari",
    icon: BarChart3,
    defaultPrompt: "Tu sei LP.PROFILER, l'agente che applica i profili di carico per POD non orari..."
  },
  {
    id: "AGG.SCHEDULER",
    name: "AGG.SCHEDULER",
    description: "Combina tutte le fonti dati e aggrega le curve",
    icon: Calendar,
    defaultPrompt: "Tu sei AGG.SCHEDULER, l'agente che combina e aggrega tutte le curve..."
  },
  {
    id: "QA.WATCHDOG",
    name: "QA.WATCHDOG",
    description: "Valida qualità dati e identifica anomalie",
    icon: Shield,
    defaultPrompt: "Tu sei QA.WATCHDOG, l'agente responsabile della validazione qualità dati..."
  },
  {
    id: "EXPORT.HUB",
    name: "EXPORT.HUB",
    description: "Genera file di output (JSON/CSV/XLSX) e payload per UI",
    icon: FileOutput,
    defaultPrompt: "Tu sei EXPORT.HUB, l'agente che genera i file di output finali..."
  }
];

export function AgentsConfig() {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("agent_prompts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const loadedPrompts: Record<string, string> = {};
      data?.forEach(p => {
        loadedPrompts[p.agent_id] = p.prompt;
      });

      // Inizializza con i prompt di default per gli agenti non configurati
      const initialPrompts: Record<string, string> = {};
      AGENTS.forEach(agent => {
        initialPrompts[agent.id] = loadedPrompts[agent.id] || agent.defaultPrompt;
      });

      setPrompts(initialPrompts);
    } catch (error) {
      console.error("Error loading prompts:", error);
      toast.error("Errore nel caricamento dei prompt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Salva tutti i prompt
      for (const [agentId, prompt] of Object.entries(prompts)) {
        const { error } = await supabase
          .from("agent_prompts")
          .upsert({
            user_id: user.id,
            agent_id: agentId,
            prompt: prompt,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "user_id,agent_id"
          });

        if (error) throw error;
      }

      toast.success("Prompt agenti salvati con successo");
    } catch (error) {
      console.error("Error saving prompts:", error);
      toast.error("Errore nel salvataggio dei prompt");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Configurazione Agenti AI</h2>
        <p className="text-muted-foreground mt-1">
          Personalizza i prompt per ciascuno degli 8 agenti del sistema di dispacciamento
        </p>
      </div>

      <div className="grid gap-6">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {agent.name}
                </CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={agent.id}>Prompt Sistema</Label>
                  <Textarea
                    id={agent.id}
                    value={prompts[agent.id] || ""}
                    onChange={(e) => setPrompts(prev => ({ ...prev, [agent.id]: e.target.value }))}
                    placeholder={`Inserisci il prompt per ${agent.name}...`}
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salva Tutti i Prompt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
