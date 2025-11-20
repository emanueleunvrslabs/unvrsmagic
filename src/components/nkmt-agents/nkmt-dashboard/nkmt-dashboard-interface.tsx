import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAgentStates } from "@/hooks/use-agent-states"
import { useAgentMessages } from "@/hooks/use-agent-messages"
import { Activity, Brain, TrendingUp, AlertCircle, Clock, CheckCircle2 } from "lucide-react"

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{AGENT_NAMES.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {agentStates?.filter(s => s.status === 'processing' || s.status === 'idle').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {messages?.filter(m => m.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messages?.filter(m => m.status === 'processed').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENT_NAMES.map(agent => {
          const status = getAgentStatus(agent.id)
          const metrics = getAgentMetrics(agent.id)
          const lastExecution = getAgentLastExecution(agent.id)
          const Icon = agent.icon

          return (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </div>
                  <Badge className={`${getStatusColor(status)} text-white`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(status)}
                      {status}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Last Execution:</span>
                  <div className="font-mono text-xs mt-1">{formatTimestamp(lastExecution)}</div>
                </div>
                
                {Object.keys(metrics).length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Performance Metrics:</span>
                    <div className="font-mono text-xs mt-1 space-y-1">
                      {Object.entries(metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span className="font-semibold">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Message Stream */}
      <Card>
        <CardHeader>
          <CardTitle>Message Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {messagesLoading && <div className="text-muted-foreground">Loading messages...</div>}
              {messages && messages.length === 0 && (
                <div className="text-muted-foreground">No messages yet</div>
              )}
              {messages?.map(msg => (
                <div
                  key={msg.id}
                  className="border rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{msg.sender_agent}</Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge variant="outline">{msg.receiver_agent}</Badge>
                    </div>
                    <Badge className={msg.status === 'processed' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {msg.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm font-medium">{msg.message_type}</div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                  
                  {msg.processed_at && (
                    <div className="text-xs text-muted-foreground">
                      Processed: {new Date(msg.processed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}