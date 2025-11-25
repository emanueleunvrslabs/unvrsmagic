import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPrompt: string;
}

interface SingleAgentConfigProps {
  agent: AgentConfig;
}

export function SingleAgentConfig({ agent }: SingleAgentConfigProps) {
  const [prompt, setPrompt] = useState(agent.defaultPrompt);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, [agent.id]);

  const loadPrompt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Devi essere autenticato");
        return;
      }

      const { data, error } = await supabase
        .from("agent_prompts")
        .select("prompt")
        .eq("user_id", user.id)
        .eq("agent_id", agent.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPrompt(data.prompt);
      }
    } catch (error) {
      console.error("Errore caricamento prompt:", error);
      toast.error("Errore nel caricamento del prompt");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Devi essere autenticato");
        return;
      }

      const { error } = await supabase
        .from("agent_prompts")
        .upsert({
          user_id: user.id,
          agent_id: agent.id,
          prompt: prompt,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Prompt salvato con successo");
    } catch (error) {
      console.error("Errore salvataggio prompt:", error);
      toast.error("Errore nel salvataggio del prompt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const IconComponent = agent.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>{agent.name}</CardTitle>
            <CardDescription>{agent.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`prompt-${agent.id}`}>Prompt Agente</Label>
          <Textarea
            id={`prompt-${agent.id}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Inserisci il prompt per questo agente..."
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salva Prompt
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
