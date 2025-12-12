"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  ArrowLeftRight, 
  Users, 
  ClipboardList, 
  FileText, 
  Presentation, 
  Phone,
  Lightbulb,
  Send,
  MessageSquare,
  Activity,
  Clock,
  Settings,
  History,
  Save,
  Loader2,
  type LucideIcon
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AgentConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  model: string;
  edgeFunctionName: string;
}

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  brain: { id: "brain", name: "UNVRS.BRAIN", icon: Brain, description: "Central orchestrator that routes messages to appropriate agents", model: "Orchestrator", edgeFunctionName: "unvrs-brain" },
  switch: { id: "switch", name: "UNVRS.SWITCH", icon: ArrowLeftRight, description: "Switchboard for non-client users, handles qualification", model: "Claude Sonnet", edgeFunctionName: "unvrs-switch" },
  hlo: { id: "hlo", name: "UNVRS.HLO", icon: Users, description: "Personal client agent, one per client", model: "Claude Sonnet", edgeFunctionName: "unvrs-hlo" },
  intake: { id: "intake", name: "UNVRS.INTAKE", icon: ClipboardList, description: "Collects structured project requirements", model: "Claude Sonnet", edgeFunctionName: "unvrs-intake" },
  quote: { id: "quote", name: "UNVRS.QUOTE", icon: FileText, description: "Generates detailed project quotes", model: "GPT-5", edgeFunctionName: "unvrs-quote" },
  deck: { id: "deck", name: "UNVRS.DECK", icon: Presentation, description: "Creates presentations via Gamma API", model: "Claude Sonnet", edgeFunctionName: "unvrs-deck" },
  call: { id: "call", name: "UNVRS.CALL", icon: Phone, description: "Handles voice calls and real-time conversations", model: "GPT Realtime", edgeFunctionName: "unvrs-call" },
  "social-brain": { id: "social-brain", name: "UNVRS.SOCIAL.BRAIN", icon: Lightbulb, description: "Content strategy and planning", model: "Claude Sonnet", edgeFunctionName: "unvrs-social-brain" },
  "social-publisher": { id: "social-publisher", name: "UNVRS.SOCIAL.PUBLISHER", icon: Send, description: "Optimizes and publishes content", model: "Claude Haiku", edgeFunctionName: "unvrs-social-publisher" },
  "social-reply": { id: "social-reply", name: "UNVRS.SOCIAL.REPLY", icon: MessageSquare, description: "Responds to comments and DMs", model: "Claude Haiku", edgeFunctionName: "unvrs-social-reply" },
};

interface AgentState {
  status: string | null;
  last_execution: string | null;
  last_error: string | null;
  performance_metrics: any;
}

interface AgentLog {
  id: string;
  log_level: string;
  message: string;
  timestamp: string | null;
  action: string | null;
  duration_ms: number | null;
}

interface AgentSession {
  id: string;
  conversation_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  state: any;
}

export default function AgentDashboard() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const config = agentId ? AGENT_CONFIGS[agentId] : null;

  useEffect(() => {
    if (config) {
      fetchData();
    }
  }, [agentId, config]);

  const fetchData = async () => {
    if (!config) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch agent state
    const { data: state } = await supabase
      .from("agent_state")
      .select("*")
      .eq("user_id", user.id)
      .eq("agent_name", config.name)
      .single();

    // Fetch logs
    const { data: agentLogs } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("agent_name", config.name)
      .order("timestamp", { ascending: false })
      .limit(50);

    // Fetch sessions
    const { data: agentSessions } = await supabase
      .from("unvrs_agent_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("agent_type", config.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch prompt
    const { data: promptData } = await supabase
      .from("agent_prompts")
      .select("prompt")
      .eq("user_id", user.id)
      .eq("agent_id", config.id)
      .single();

    setAgentState(state || null);
    setLogs(agentLogs || []);
    setSessions(agentSessions || []);
    setPrompt(promptData?.prompt || "");
    setOriginalPrompt(promptData?.prompt || "");
    setLoading(false);
  };

  const savePrompt = async () => {
    if (!config) return;
    
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("agent_prompts")
      .upsert({
        user_id: user.id,
        agent_id: config.id,
        prompt: prompt,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,agent_id" });

    if (error) {
      toast.error("Failed to save prompt");
    } else {
      toast.success("Prompt saved successfully");
      setOriginalPrompt(prompt);
    }
    setSaving(false);
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error": return "text-red-400 bg-red-500/20";
      case "warn": return "text-yellow-400 bg-yellow-500/20";
      case "info": return "text-blue-400 bg-blue-500/20";
      default: return "text-white/60 bg-white/10";
    }
  };

  if (!config) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-white/50">Agent not found</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      </DashboardLayout>
    );
  }

  const Icon = config.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">{config.name}</h1>
              <p className="text-white/60">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-white/20 text-white/70">
              {config.model}
            </Badge>
            {agentState?.status === "active" ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
            ) : agentState?.status === "error" ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>
            ) : (
              <Badge className="bg-white/10 text-white/60 border-white/20">Idle</Badge>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="social-media-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">{logs.length}</p>
                  <p className="text-sm text-white/60">Total Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="social-media-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">{sessions.length}</p>
                  <p className="text-sm text-white/60">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="social-media-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {agentState?.last_execution 
                      ? format(new Date(agentState.last_execution), "HH:mm")
                      : "--:--"}
                  </p>
                  <p className="text-sm text-white/60">Last Run</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="social-media-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {logs.filter(l => l.duration_ms).reduce((acc, l) => acc + (l.duration_ms || 0), 0) / Math.max(logs.filter(l => l.duration_ms).length, 1) | 0}ms
                  </p>
                  <p className="text-sm text-white/60">Avg Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="logs" className="data-[state=active]:bg-white/10">Logs</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-white/10">Sessions</TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-white/10">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4">
            <Card className="social-media-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-8">No logs yet</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getLogLevelColor(log.log_level)}`}>
                              {log.log_level.toUpperCase()}
                            </span>
                            {log.action && (
                              <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                                {log.action}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {log.duration_ms && (
                              <span className="text-xs text-white/40">{log.duration_ms}ms</span>
                            )}
                            <span className="text-xs text-white/40">
                              {log.timestamp ? format(new Date(log.timestamp), "MMM d, HH:mm:ss") : ""}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-white/80">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="mt-4">
            <Card className="social-media-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Agent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-8">No sessions yet</p>
                  ) : (
                    sessions.map((session) => (
                      <div key={session.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">
                            Session {session.id.slice(0, 8)}...
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${session.ended_at ? 'border-white/20 text-white/50' : 'border-emerald-500/30 text-emerald-400'}`}
                          >
                            {session.ended_at ? "Completed" : "Active"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>Started: {session.started_at ? format(new Date(session.started_at), "MMM d, HH:mm") : "N/A"}</span>
                          {session.ended_at && (
                            <span>Ended: {format(new Date(session.ended_at), "MMM d, HH:mm")}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <Card className="social-media-card border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">System Prompt</CardTitle>
                  <Button
                    onClick={savePrompt}
                    disabled={saving || prompt === originalPrompt}
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter the system prompt for this agent..."
                  className="min-h-[300px] bg-white/5 border-white/10 text-white placeholder:text-white/40 font-mono text-sm"
                />
                <p className="text-xs text-white/40 mt-2">
                  This prompt will be used as the system instructions for {config.name}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
