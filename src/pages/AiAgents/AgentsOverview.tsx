"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface AgentState {
  agent_name: string;
  status: string | null;
  last_execution: string | null;
  last_error: string | null;
  performance_metrics: any;
}

interface AgentLog {
  id: string;
  agent_name: string;
  log_level: string;
  message: string;
  timestamp: string | null;
  action: string | null;
}

interface Conversation {
  id: string;
  contact_name: string | null;
  contact_identifier: string;
  channel: string;
  current_agent: string | null;
  status: string;
  last_message_at: string | null;
}

const AGENTS = [
  { id: "brain", name: "UNVRS.BRAIN", icon: Brain, description: "Orchestrator", href: "/ai-agents/brain" },
  { id: "switch", name: "UNVRS.SWITCH", icon: ArrowLeftRight, description: "Switchboard", href: "/ai-agents/switch" },
  { id: "hlo", name: "UNVRS.HLO", icon: Users, description: "Client Agent", href: "/ai-agents/hlo" },
  { id: "intake", name: "UNVRS.INTAKE", icon: ClipboardList, description: "Requirements", href: "/ai-agents/intake" },
  { id: "quote", name: "UNVRS.QUOTE", icon: FileText, description: "Quotes", href: "/ai-agents/quote" },
  { id: "deck", name: "UNVRS.DECK", icon: Presentation, description: "Presentations", href: "/ai-agents/deck" },
  { id: "call", name: "UNVRS.CALL", icon: Phone, description: "Voice Calls", href: "/ai-agents/call" },
  { id: "social-brain", name: "UNVRS.SOCIAL.BRAIN", icon: Lightbulb, description: "Content Strategy", href: "/ai-agents/social-brain" },
  { id: "social-publisher", name: "UNVRS.SOCIAL.PUBLISHER", icon: Send, description: "Publishing", href: "/ai-agents/social-publisher" },
  { id: "social-reply", name: "UNVRS.SOCIAL.REPLY", icon: MessageSquare, description: "Replies", href: "/ai-agents/social-reply" },
];

export default function AgentsOverview() {
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [recentLogs, setRecentLogs] = useState<AgentLog[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState({ totalMessages: 0, avgResponseTime: 0, activeAgents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch agent states
    const { data: states } = await supabase
      .from("agent_state")
      .select("*")
      .eq("user_id", user.id);

    // Fetch recent logs
    const { data: logs } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(20);

    // Fetch active conversations
    const { data: convs } = await supabase
      .from("unvrs_conversations")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .order("last_message_at", { ascending: false })
      .limit(10);

    // Calculate stats
    const { count: messageCount } = await supabase
      .from("unvrs_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setAgentStates(states || []);
    setRecentLogs(logs || []);
    setConversations(convs || []);
    setStats({
      totalMessages: messageCount || 0,
      avgResponseTime: 2.3, // Placeholder
      activeAgents: (states || []).filter(s => s.status === "active").length
    });
    setLoading(false);
  };

  const getAgentStatus = (agentName: string) => {
    const state = agentStates.find(s => s.agent_name.toLowerCase().includes(agentName.toLowerCase()));
    return state?.status || "idle";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case "error":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      default:
        return <Badge className="bg-white/10 text-white/60 border-white/20">Idle</Badge>;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error": return "text-red-400";
      case "warn": return "text-yellow-400";
      case "info": return "text-blue-400";
      default: return "text-white/60";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">AI Agents</h1>
          <p className="text-white/60">Monitor and manage your UNVRS agent system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="social-media-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats.activeAgents}</p>
                  <p className="text-sm text-white/60">Active Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="social-media-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats.totalMessages}</p>
                  <p className="text-sm text-white/60">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="social-media-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats.avgResponseTime}s</p>
                  <p className="text-sm text-white/60">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="social-media-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <MessageSquare className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{conversations.length}</p>
                  <p className="text-sm text-white/60">Active Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Status Cards */}
        <Card className="social-media-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Agent Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AGENTS.map((agent) => {
                const Icon = agent.icon;
                const status = getAgentStatus(agent.id);
                return (
                  <Link
                    key={agent.id}
                    to={agent.href}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-white/10">
                        <Icon className="h-4 w-4 text-white/80" />
                      </div>
                      {getStatusBadge(status)}
                    </div>
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <p className="text-xs text-white/50">{agent.description}</p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Logs */}
          <Card className="social-media-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentLogs.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-8">No logs yet</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                            {log.agent_name}
                          </Badge>
                          <span className={`text-xs font-medium ${getLogLevelColor(log.log_level)}`}>
                            {log.log_level.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-white/40">
                          {log.timestamp ? format(new Date(log.timestamp), "HH:mm:ss") : ""}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 line-clamp-2">{log.message}</p>
                      {log.action && (
                        <span className="text-xs text-white/40 mt-1 block">Action: {log.action}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Conversations */}
          <Card className="social-media-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Active Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-8">No active conversations</p>
                ) : (
                  conversations.map((conv) => (
                    <div key={conv.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {conv.contact_name || conv.contact_identifier}
                        </span>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          {conv.channel}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50">
                          Agent: {conv.current_agent || "BRAIN"}
                        </span>
                        <span className="text-xs text-white/40">
                          {conv.last_message_at ? format(new Date(conv.last_message_at), "HH:mm") : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
