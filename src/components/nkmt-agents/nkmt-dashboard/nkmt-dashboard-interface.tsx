import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAgentStates } from "@/hooks/use-agent-states"
import { useAgentMessages } from "@/hooks/use-agent-messages"
import { Activity, Brain, TrendingUp, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import "@/components/labs/SocialMediaCard.css"

const AGENT_NAMES = [
  { id: 'mkt.data', name: 'Mkt.Data', icon: TrendingUp },
  { id: 'deriv.data', name: 'Deriv.Data', icon: Activity },
  { id: 'sentiment.scout', name: 'Sentiment.Scout', icon: Activity },
  { id: 'chain.analyst', name: 'Chain.Analyst', icon: Activity },
  { id: 'market.modeler', name: 'Market.Modeler', icon: Activity },
  { id: 'signal.maker', name: 'Signal.Maker', icon: Activity },
  { id: 'risk.mgr', name: 'Risk.Mgr', icon: Activity },
  { id: 'trade.executor', name: 'Trade.Executor', icon: Activity },
  { id: 'reviewer', name: 'Reviewer', icon: Activity },
  { id: 'nkmt', name: 'NKMT', icon: Brain },
]

export const NKMTDashboardInterface = () => {
  const { data: agentStates, isLoading: statesLoading } = useAgentStates()
  const { data: messages, isLoading: messagesLoading } = useAgentMessages()

  const getAgentStatus = (agentId: string) => {
    const state = agentStates?.find(s => s.agent_name === agentId)
    return state?.status || 'unknown'
  }

  const getAgentMetrics = (agentId: string) => {
    const state = agentStates?.find(s => s.agent_name === agentId)
    return state?.performance_metrics || {}
  }

  const getAgentLastExecution = (agentId: string) => {
    const state = agentStates?.find(s => s.agent_name === agentId)
    return state?.last_execution
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-500'
      case 'idle': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4" />
      case 'idle': return <CheckCircle2 className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            NKMT Orchestrator
          </h1>
          <p className="text-muted-foreground mt-1">
            Central brain coordinating all NKMT agents
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative p-5 z-10">
            <p className="text-sm text-gray-400 mb-1">Total Agents</p>
            <p className="text-2xl font-bold text-white">{AGENT_NAMES.length}</p>
          </div>
        </div>

        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative p-5 z-10">
            <p className="text-sm text-gray-400 mb-1">Active Agents</p>
            <p className="text-2xl font-bold text-green-500">
              {agentStates?.filter(s => s.status === 'processing' || s.status === 'idle').length || 0}
            </p>
          </div>
        </div>

        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative p-5 z-10">
            <p className="text-sm text-gray-400 mb-1">Pending Messages</p>
            <p className="text-2xl font-bold text-blue-500">
              {messages?.filter(m => m.status === 'pending').length || 0}
            </p>
          </div>
        </div>

        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative p-5 z-10">
            <p className="text-sm text-gray-400 mb-1">Messages Processed</p>
            <p className="text-2xl font-bold text-white">
              {messages?.filter(m => m.status === 'processed').length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENT_NAMES.map(agent => {
          const status = getAgentStatus(agent.id)
          const metrics = getAgentMetrics(agent.id)
          const lastExecution = getAgentLastExecution(agent.id)
          const Icon = agent.icon

          return (
            <div key={agent.id} className="labs-client-card relative rounded-2xl overflow-hidden">
              <div className="relative p-5 z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold text-white">{agent.name}</span>
                  </div>
                  <Badge className={`${getStatusColor(status)} text-white`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(status)}
                      {status}
                    </div>
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Last Execution:</span>
                  <div className="font-mono text-xs mt-1 text-white/80">{formatTimestamp(lastExecution)}</div>
                </div>
                
                {Object.keys(metrics).length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-400">Performance Metrics:</span>
                    <div className="font-mono text-xs mt-1 space-y-1">
                      {Object.entries(metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-white/80">
                          <span>{key}:</span>
                          <span className="font-semibold">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Message Stream */}
      <div className="labs-client-card relative rounded-2xl overflow-hidden">
        <div className="relative p-5 z-10">
          <h3 className="text-lg font-semibold text-white mb-4">Message Stream</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {messagesLoading && <div className="text-gray-400">Loading messages...</div>}
              {messages && messages.length === 0 && (
                <div className="text-gray-400">No messages yet</div>
              )}
              {messages?.map(msg => (
                <div
                  key={msg.id}
                  className="border border-white/10 rounded-lg p-3 space-y-1 bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-white/20 text-white/80">{msg.sender_agent}</Badge>
                      <span className="text-xs text-gray-400">→</span>
                      <Badge variant="outline" className="border-white/20 text-white/80">{msg.receiver_agent}</Badge>
                    </div>
                    <Badge className={msg.status === 'processed' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {msg.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm font-medium text-white">{msg.message_type}</div>
                  
                  <div className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                  
                  {msg.processed_at && (
                    <div className="text-xs text-gray-400">
                      Processed: {new Date(msg.processed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}