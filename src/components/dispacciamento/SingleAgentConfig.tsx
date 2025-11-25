import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      setIsDialogOpen(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{agent.name}</h2>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Configura Prompt - {agent.name}</DialogTitle>
              <DialogDescription>
                Modifica il prompt per personalizzare il comportamento dell'agente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor={`prompt-${agent.id}`}>Prompt Agente</Label>
                <Textarea
                  id={`prompt-${agent.id}`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Inserisci il prompt per questo agente..."
                  className="min-h-[400px] font-mono text-sm"
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
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Agente</CardTitle>
          <CardDescription>
            Informazioni e metriche relative alle attività dell'agente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Questa sezione mostrerà le informazioni specifiche del compito svolto dall'agente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
