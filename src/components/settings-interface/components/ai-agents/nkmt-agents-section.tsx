"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import type { ApiKey } from "../../types"
import { Settings, FileText } from "lucide-react"
import { NKMTAgentApiModal } from "./nkmt-agent-api-modal"
import { NKMTAgentPromptModal } from "./nkmt-agent-prompt-modal"

const NKMT_AGENTS = [
  { id: "nkmt", name: "NKMT", model: "GPT-5.1 Thinking", description: "Main orchestrator", requiresApi: "openai", externalApis: [] },
  { id: "mkt-data", name: "Mkt.data", model: "Code", description: "Market data processor", requiresApi: null, externalApis: [
    { name: "CoinGecko", provider: "coingecko", placeholder: "Enter CoinGecko API key" },
    { name: "CoinMarketCap", provider: "coinmarketcap", placeholder: "Enter CoinMarketCap API key" }
  ]},
  { id: "deriv-data", name: "Deriv.data", model: "Code", description: "Derivatives data processor", requiresApi: null, externalApis: [] },
  { id: "sentiment-scout", name: "Sentiment.scout", model: "GPT-5.1", description: "Sentiment analysis", requiresApi: "openai", externalApis: [] },
  { id: "chain-analyst", name: "Chain.analyst", model: "Qwen 3", description: "Blockchain analysis", requiresApi: "qwen", externalApis: [] },
  { id: "market-modeler", name: "Market.modeler", model: "Claude Sonnet 4.5", description: "Market modeling", requiresApi: "anthropic", externalApis: [] },
  { id: "signal-maker", name: "Signal.maker", model: "GPT-5.1 Thinking", description: "Signal generation", requiresApi: "openai", externalApis: [] },
  { id: "risk-mgr", name: "Risk.mgr", model: "GPT-5.1 Thinking", description: "Risk management", requiresApi: "openai", externalApis: [] },
  { id: "trade-executor", name: "Trade.executor", model: "Code", description: "Trade execution", requiresApi: null, externalApis: [] },
  { id: "reviewer", name: "Reviewer", model: "Claude Sonnet 4.5", description: "Trade review", requiresApi: "anthropic", externalApis: [] },
]

export const NKMTAgentsSection: React.FC<{ apiKeys?: ApiKey[] }> = ({ apiKeys }) => {
  const [connectedApis, setConnectedApis] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<typeof NKMT_AGENTS[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPromptAgent, setSelectedPromptAgent] = useState<typeof NKMT_AGENTS[0] | null>(null)
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false)

  useEffect(() => {
    const normalizeProvider = (p: string) => {
      if (!p) return p
      const map: Record<string, string> = {
        chatgpt: 'openai',
        claude: 'anthropic',
      }
      return map[p] ?? p
    }

    const loadConnectedApis = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('api_keys')
          .select('provider')
          .eq('user_id', user.id)
          .in('provider', ['openai', 'anthropic', 'qwen', 'chatgpt', 'claude'])

        if (error) {
          console.error("Error loading API keys:", error)
          return
        }

        if (data) {
          const normalized = data.map((item) => normalizeProvider(item.provider))
          const apis = new Set(normalized)
          console.log("NKMT: Loaded APIs:", Array.from(apis))
          setConnectedApis(apis)
        }
      } catch (error) {
        console.error("Error loading connected APIs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConnectedApis()
  }, [])

  // Merge providers coming from props (SecurityTab state) if available
  useEffect(() => {
    if (!apiKeys) return
    const normalizeProvider = (p: string) => (p === 'chatgpt' ? 'openai' : p === 'claude' ? 'anthropic' : p)
    const fromProps = new Set(apiKeys.map(k => normalizeProvider((k as any).provider)))
    setConnectedApis(prev => new Set([...prev, ...fromProps]))
  }, [apiKeys])

  const isAgentConnected = (agent: typeof NKMT_AGENTS[0]) => {
    // Code-based agents are always connected
    if (!agent.requiresApi) return true
    // Check if the required API is connected
    const isConnected = connectedApis.has(agent.requiresApi)
    console.log(`NKMT: Agent ${agent.name} (requires ${agent.requiresApi}):`, isConnected, "Available APIs:", Array.from(connectedApis))
    return isConnected
  }

  const handleOpenApiModal = (agent: typeof NKMT_AGENTS[0]) => {
    setSelectedAgent(agent)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAgent(null)
  }

  const handleOpenPromptModal = (agent: typeof NKMT_AGENTS[0]) => {
    setSelectedPromptAgent(agent)
    setIsPromptModalOpen(true)
  }

  const handleClosePromptModal = () => {
    setIsPromptModalOpen(false)
    setSelectedPromptAgent(null)
  }

  const handleApiSuccess = () => {
    // Reload connected APIs
    const normalizeProvider = (p: string) => {
      if (!p) return p
      const map: Record<string, string> = {
        chatgpt: 'openai',
        claude: 'anthropic',
      }
      return map[p] ?? p
    }

    const loadConnectedApis = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('api_keys')
          .select('provider')
          .eq('user_id', user.id)
          .in('provider', ['openai', 'anthropic', 'qwen', 'chatgpt', 'claude', 'coingecko', 'coinmarketcap'])

        if (error) {
          console.error("Error loading API keys:", error)
          return
        }

        if (data) {
          const normalized = data.map((item) => normalizeProvider(item.provider))
          const apis = new Set(normalized)
          setConnectedApis(apis)
        }
      } catch (error) {
        console.error("Error loading connected APIs:", error)
      }
    }

    loadConnectedApis()
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-foreground/80">Agent</TableHead>
              <TableHead className="text-foreground/80">Model</TableHead>
              <TableHead className="text-foreground/80">Description</TableHead>
              <TableHead className="text-center text-foreground/80">API Config</TableHead>
              <TableHead className="text-center text-foreground/80">Prompt</TableHead>
              <TableHead className="text-right text-foreground/80">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {NKMT_AGENTS.map((agent) => (
              <TableRow key={agent.id} className="border-white/10">
                <TableCell className="font-medium text-foreground">{agent.name}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    agent.model === "Code" 
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  }`}>
                    {agent.model}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{agent.description}</TableCell>
                <TableCell className="text-center">
                  {agent.externalApis && agent.externalApis.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenApiModal(agent)}
                      className="h-8 w-8 p-0 hover:bg-white/10"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenPromptModal(agent)}
                    className="h-8 w-8 p-0 hover:bg-white/10"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isAgentConnected(agent) 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}>
                    {isAgentConnected(agent) ? "Connected" : "Not connected"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedAgent && (
        <NKMTAgentApiModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          agentName={selectedAgent.name}
          agentId={selectedAgent.id}
          externalApis={selectedAgent.externalApis || []}
          onSuccess={handleApiSuccess}
        />
      )}

      {selectedPromptAgent && (
        <NKMTAgentPromptModal
          isOpen={isPromptModalOpen}
          onClose={handleClosePromptModal}
          agentName={selectedPromptAgent.name}
          agentId={selectedPromptAgent.id}
        />
      )}
    </div>
  )
}
