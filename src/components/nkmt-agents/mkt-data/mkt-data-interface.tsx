import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp, Database } from "lucide-react"
import { MktDataResults } from "./mkt-data-results"
import { useMktData } from "@/hooks/use-mkt-data"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const MktDataInterface = () => {
  const { data, isLoading, error, initializeConfig } = useMktData()

  useEffect(() => {
    initializeConfig()
  }, [])

  // Transform data for MktDataResults component
  const transformedResults = data.length > 0 ? {
    data_sources_used: Array.from(new Set(data.flatMap(d => d.data_sources || []))).map(source => ({
      name: source,
      notes: `Data from ${source}`
    })),
    symbols: groupDataBySymbol(data),
    errors: []
  } : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mkt.data Agent</h1>
        <p className="text-muted-foreground mt-2">
          Market data collection running automatically in background for top 100 cryptocurrencies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">
              Total market data records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Symbols</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(data.map(d => d.symbol)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique trading pairs tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Auto-updating every 5 minutes
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && data.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
              <p>Loading market data...</p>
            </div>
          </CardContent>
        </Card>
      ) : transformedResults ? (
        <MktDataResults results={transformedResults} />
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>No market data available yet. The agent will start collecting data automatically.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function groupDataBySymbol(data: any[]) {
  const symbolMap = new Map()
  
  for (const item of data) {
    if (!symbolMap.has(item.symbol)) {
      symbolMap.set(item.symbol, { symbol: item.symbol, markets: [] })
    }
    
    const symbolData = symbolMap.get(item.symbol)
    let marketData = symbolData.markets.find((m: any) => m.market_type === item.market_type)
    
    if (!marketData) {
      marketData = { market_type: item.market_type, timeframes: [] }
      symbolData.markets.push(marketData)
    }
    
    marketData.timeframes.push({
      timeframe: item.timeframe,
      ohlcv: item.ohlcv,
      confidence_score: item.confidence_score,
      notes: item.notes
    })
  }
  
  return Array.from(symbolMap.values())
}
