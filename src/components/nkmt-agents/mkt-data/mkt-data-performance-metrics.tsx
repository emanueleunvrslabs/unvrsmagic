import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Clock, TrendingUp } from "lucide-react"

interface PerformanceMetrics {
  last_collection_at?: string
  symbols_collected?: number
  errors_count?: number
  data_sources_used?: string[]
  total_data_points?: number
  unique_symbols?: number
}

interface MktDataPerformanceMetricsProps {
  metrics: PerformanceMetrics | null
}

export const MktDataPerformanceMetrics = ({ metrics }: MktDataPerformanceMetricsProps) => {
  if (!metrics) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Symbols Collected</span>
            </div>
            <div className="text-2xl font-bold">{metrics.symbols_collected || 0}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Total Data Points</span>
            </div>
            <div className="text-2xl font-bold">{metrics.total_data_points || 0}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Unique Symbols</span>
            </div>
            <div className="text-2xl font-bold">{metrics.unique_symbols || 0}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Errors</span>
            </div>
            <div className={`text-2xl font-bold ${(metrics.errors_count || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {metrics.errors_count || 0}
            </div>
          </div>
        </div>

        {metrics.data_sources_used && metrics.data_sources_used.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <div className="text-sm font-medium">Data Sources Used</div>
            <div className="flex flex-wrap gap-2">
              {metrics.data_sources_used.map((source) => (
                <Badge key={source} variant="secondary">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {metrics.last_collection_at && (
          <div className="space-y-2 pt-4 border-t">
            <div className="text-sm font-medium">Last Collection</div>
            <div className="text-xs text-muted-foreground font-mono">
              {new Date(metrics.last_collection_at).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}