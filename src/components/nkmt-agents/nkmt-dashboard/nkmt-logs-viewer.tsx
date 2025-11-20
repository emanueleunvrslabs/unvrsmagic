import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAgentLogs } from "@/hooks/use-agent-logs"
import { useState } from "react"
import { AlertCircle, Info, AlertTriangle, Bug } from "lucide-react"

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Agent Logs</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[120px]">
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
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Loading logs...
            </div>
          )}
          
          {!isLoading && logs && logs.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No logs found
            </div>
          )}

          <div className="space-y-2">
            {logs?.map(log => {
              const Icon = LOG_LEVEL_ICONS[log.log_level as keyof typeof LOG_LEVEL_ICONS]
              
              return (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Badge 
                        className={`${LOG_LEVEL_COLORS[log.log_level as keyof typeof LOG_LEVEL_COLORS]} text-white`}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {log.log_level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{log.agent_name}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <div className="text-sm">{log.message}</div>

                  {log.action && (
                    <div className="text-xs text-muted-foreground">
                      Action: <span className="font-mono">{log.action}</span>
                    </div>
                  )}

                  {log.duration_ms !== null && (
                    <div className="text-xs text-muted-foreground">
                      Duration: <span className="font-mono">{log.duration_ms}ms</span>
                    </div>
                  )}

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Metadata
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded font-mono text-xs overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}