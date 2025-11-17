"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"

const NKMT_AGENTS = [
  { id: "nkmt", name: "NKMT", model: "GPT-5.1 Thinking", description: "Main orchestrator", requiresApi: "openai" },
  { id: "mkt-data", name: "Mkt.data", model: "Code", description: "Market data processor", requiresApi: null },
  { id: "deriv-data", name: "Deriv.data", model: "Code", description: "Derivatives data processor", requiresApi: null },
  { id: "sentiment-scout", name: "Sentiment.scout", model: "GPT-5.1", description: "Sentiment analysis", requiresApi: "openai" },
  { id: "chain-analyst", name: "Chain.analyst", model: "Qwen 3", description: "Blockchain analysis", requiresApi: null },
  { id: "market-modeler", name: "Market.modeler", model: "Claude Sonnet 4.5", description: "Market modeling", requiresApi: "anthropic" },
  { id: "signal-maker", name: "Signal.maker", model: "GPT-5.1 Thinking", description: "Signal generation", requiresApi: "openai" },
  { id: "risk-mgr", name: "Risk.mgr", model: "GPT-5.1 Thinking", description: "Risk management", requiresApi: "openai" },
  { id: "trade-executor", name: "Trade.executor", model: "Code", description: "Trade execution", requiresApi: null },
  { id: "reviewer", name: "Reviewer", model: "Claude Sonnet 4.5", description: "Trade review", requiresApi: "anthropic" },
]

export const NKMTAgentsSection: React.FC = () => {
  const [connectedApis, setConnectedApis] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConnectedApis = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('api_keys')
          .select('provider')
          .eq('user_id', user.id)
          .in('provider', ['openai', 'anthropic'])

        if (error) {
          console.error("Error loading API keys:", error)
          return
        }

        if (data) {
          setConnectedApis(new Set(data.map(item => item.provider)))
        }
      } catch (error) {
        console.error("Error loading connected APIs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConnectedApis()
  }, [])

  const isAgentConnected = (agent: typeof NKMT_AGENTS[0]) => {
    // Code-based agents are always connected
    if (!agent.requiresApi) return true
    // Check if the required API is connected
    return connectedApis.has(agent.requiresApi)
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {NKMT_AGENTS.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell className="font-medium">{agent.name}</TableCell>
              <TableCell>
                <Badge variant={agent.model === "Code" ? "outline" : "secondary"}>
                  {agent.model}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{agent.description}</TableCell>
              <TableCell className="text-right">
                {isAgentConnected(agent) ? (
                  <span className="text-green-600 text-sm font-medium">Connected</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Not connected</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
