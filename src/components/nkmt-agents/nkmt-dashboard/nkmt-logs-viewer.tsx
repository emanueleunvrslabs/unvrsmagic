import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAgentLogs } from "@/hooks/use-agent-logs"
import { useState } from "react"
import { AlertCircle, Info, AlertTriangle, Bug } from "lucide-react"
import "@/components/labs/SocialMediaCard.css"

const LOG_LEVEL_COLORS = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  debug: 'bg-gray-500'
}

const LOG_LEVEL_ICONS = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  debug: Bug
}

export const NKMTLogsViewer = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  
  const { data: logs, isLoading } = useAgentLogs(
    selectedAgent === 'all' ? undefined : selectedAgent,
    selectedLevel === 'all' ? undefined : selectedLevel
  )

  const agents = ['all', 'mkt.data', 'deriv.data', 'nkmt', 'signal.maker', 'risk.mgr']
  const levels = ['all', 'info', 'warning', 'error', 'debug']

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="labs-client-card relative rounded-2xl overflow-hidden h-full">
      <div className="relative p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Agent Logs</h3>
          <div className="flex gap-2">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent} value={agent}>
                    {agent === 'all' ? 'All Agents' : agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[120px] bg-white/5 border-white/10">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          {isLoading && (
            <div className="text-center text-gray-400 py-8">
              Loading logs...
            </div>
          )}
          
          {!isLoading && logs && logs.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No logs found
            </div>
          )}

          <div className="space-y-2">
            {logs?.map(log => {
              const Icon = LOG_LEVEL_ICONS[log.log_level as keyof typeof LOG_LEVEL_ICONS]
              
              return (
                <div
                  key={log.id}
                  className="border border-white/10 rounded-lg p-3 space-y-2 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Badge 
                        className={`${LOG_LEVEL_COLORS[log.log_level as keyof typeof LOG_LEVEL_COLORS]} text-white`}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {log.log_level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 text-white/80">{log.agent_name}</Badge>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <div className="text-sm text-white">{log.message}</div>

                  {log.action && (
                    <div className="text-xs text-gray-400">
                      Action: <span className="font-mono">{log.action}</span>
                    </div>
                  )}

                  {log.duration_ms !== null && (
                    <div className="text-xs text-gray-400">
                      Duration: <span className="font-mono">{log.duration_ms}ms</span>
                    </div>
                  )}

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-400 hover:text-white">
                        Metadata
                      </summary>
                      <pre className="mt-2 p-2 bg-white/5 rounded font-mono text-xs overflow-x-auto text-white/80">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}