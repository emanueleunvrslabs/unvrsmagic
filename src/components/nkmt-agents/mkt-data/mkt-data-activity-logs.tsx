import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ActivityLog {
  id: string
  type: 'orderbook' | 'candles' | 'tickers'
  symbol: string
  details: string
  timestamp: string
  duration: string
  status: 'success' | 'error'
}

interface MktDataActivityLogsProps {
  logs: ActivityLog[]
}

export const MktDataActivityLogs = ({ logs }: MktDataActivityLogsProps) => {
  const getIcon = (type: ActivityLog['type']) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case 'orderbook':
        return <Activity className={iconClass} />
      case 'candles':
        return <Clock className={iconClass} />
      case 'tickers':
        return <TrendingUp className={iconClass} />
      default:
        return <Activity className={iconClass} />
    }
  }

  const getTypeLabel = (type: ActivityLog['type']) => {
    switch (type) {
      case 'orderbook':
        return 'Fetch Orderbook'
      case 'candles':
        return 'Fetch Candles'
      case 'tickers':
        return 'Fetch Tickers'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <CardTitle>MKT.DATA Activity Logs</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50"
              >
                <div className="mt-1">
                  {getIcon(log.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">
                      {getTypeLabel(log.type)}
                      <span className="ml-2 text-primary">{log.symbol}</span>
                    </p>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">{log.details}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{log.timestamp}</span>
                    <span>{log.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
