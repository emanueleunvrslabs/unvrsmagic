import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, AlertCircle, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface AgentDashboardProps {
  agentName: string;
  agentDescription: string;
}

export function AgentDashboard({ agentName, agentDescription }: AgentDashboardProps) {
  const [agentState, setAgentState] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 5000);
    return () => clearInterval(interval);
  }, [agentName]);

  const fetchAgentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current agent state
      const { data: stateData } = await supabase
        .from("dispatch_agents_state")
        .select("*")
        .eq("agent_name", agentName)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setAgentState(stateData);

      // Fetch recent executions (last 10)
      const { data: executionsData } = await supabase
        .from("dispatch_agents_state")
        .select("*")
        .eq("agent_name", agentName)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentExecutions(executionsData || []);

      // Fetch agent logs (last 50)
      const { data: logsData } = await supabase
        .from("agent_logs")
        .select("*")
        .eq("agent_name", agentName)
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(50);

      setAgentLogs(logsData || []);
    } catch (error) {
      console.error("Error fetching agent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      idle: "secondary",
      processing: "default",
      completed: "outline",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Activity className="w-6 h-6 animate-spin" />
            <span className="ml-2">Caricamento dati agente...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{agentName}</CardTitle>
              <CardDescription className="mt-2">{agentDescription}</CardDescription>
            </div>
            {agentState && getStatusBadge(agentState.status || "idle")}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                Ultima Esecuzione
              </div>
              <div className="text-lg font-semibold">
                {agentState?.started_at
                  ? format(new Date(agentState.started_at), "dd MMM HH:mm", { locale: it })
                  : "N/A"}
              </div>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                Progresso
              </div>
              <div className="text-lg font-semibold">{agentState?.progress || 0}%</div>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Activity className="w-4 h-4" />
                Esecuzioni Totali
              </div>
              <div className="text-lg font-semibold">{recentExecutions.length}</div>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Tasso Successo
              </div>
              <div className="text-lg font-semibold">
                {recentExecutions.length > 0
                  ? Math.round(
                      (recentExecutions.filter((e) => e.status === "completed").length /
                        recentExecutions.length) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Log Dettagliati</TabsTrigger>
          <TabsTrigger value="executions">Storico Esecuzioni</TabsTrigger>
          <TabsTrigger value="results">Risultati</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Agente</CardTitle>
              <CardDescription>Ultimi 50 log dell'agente</CardDescription>
            </CardHeader>
            <CardContent>
              {agentLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nessun log disponibile
                </div>
              ) : (
                <div className="space-y-2">
                  {agentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${getLogLevelColor(log.log_level)}`}>
                              {log.log_level.toUpperCase()}
                            </span>
                            {log.action && (
                              <Badge variant="outline" className="text-xs">
                                {log.action}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", {
                                locale: it,
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{log.message}</p>
                          {log.metadata && (
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Storico Esecuzioni</CardTitle>
              <CardDescription>Ultime 10 esecuzioni dell'agente</CardDescription>
            </CardHeader>
            <CardContent>
              {recentExecutions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nessuna esecuzione registrata
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExecutions.map((execution) => (
                    <div key={execution.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(execution.status || "idle")}
                          <span className="text-sm text-muted-foreground">
                            {execution.started_at &&
                              format(new Date(execution.started_at), "dd MMM yyyy HH:mm", {
                                locale: it,
                              })}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{execution.progress}%</span>
                      </div>

                      {execution.error_message && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md mb-3">
                          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                          <p className="text-sm text-destructive">{execution.error_message}</p>
                        </div>
                      )}

                      {execution.completed_at && execution.started_at && (
                        <div className="text-xs text-muted-foreground">
                          Durata:{" "}
                          {Math.round(
                            (new Date(execution.completed_at).getTime() -
                              new Date(execution.started_at).getTime()) /
                              1000
                          )}{" "}
                          secondi
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Risultati Processamento</CardTitle>
              <CardDescription>Risultati dell'ultima esecuzione completata</CardDescription>
            </CardHeader>
            <CardContent>
              {agentState?.result ? (
                <div className="space-y-4">
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(agentState.result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nessun risultato disponibile
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
