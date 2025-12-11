import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DataSource {
  name: string
  notes: string
}

interface MarketError {
  symbol?: string
  message: string
}

interface TimeframeData {
  timeframe: string
  confidence_score: number
  notes?: string
  ohlcv: number[][]
}

interface MarketData {
  market_type: string
  timeframes: TimeframeData[]
}

interface SymbolData {
  symbol: string
  markets: MarketData[]
}

interface MktDataResultsData {
  data_sources_used?: DataSource[]
  errors?: MarketError[]
  symbols?: SymbolData[]
}

interface MktDataResultsProps {
  results: MktDataResultsData
}

export const MktDataResults = ({ results }: MktDataResultsProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`
    return `$${volume.toFixed(2)}`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLatestOHLCV = (ohlcv: number[][]) => {
    if (!ohlcv || ohlcv.length === 0) return null
    return ohlcv[ohlcv.length - 1]
  }

  const calculateStats = (ohlcv: number[][]) => {
    if (!ohlcv || ohlcv.length === 0) return null
    
    const latest = ohlcv[ohlcv.length - 1]
    const first = ohlcv[0]
    const priceChange = ((latest[4] - first[4]) / first[4]) * 100
    const high24h = Math.max(...ohlcv.map(bar => bar[2]))
    const low24h = Math.min(...ohlcv.map(bar => bar[3]))
    const volume24h = ohlcv.reduce((sum, bar) => sum + bar[5], 0)
    
    return {
      currentPrice: latest[4],
      priceChange,
      high24h,
      low24h,
      volume24h
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Sources Used
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {results.data_sources_used?.map((source, idx) => (
              <Badge key={idx} variant="secondary" className="text-sm">
                {source.name}: {source.notes}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {results.errors && results.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Errors encountered:</div>
            <ul className="list-disc list-inside space-y-1">
              {results.errors.map((error, idx) => (
                <li key={idx} className="text-sm">
                  {error.symbol && `${error.symbol}: `}
                  {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Symbols Data */}
      {results.symbols?.map((symbolData, symbolIdx) => {
        const firstMarket = symbolData.markets?.[0]
        const firstTimeframe = firstMarket?.timeframes?.[0]
        const stats = firstTimeframe ? calculateStats(firstTimeframe.ohlcv) : null
        const latestBar = firstTimeframe ? getLatestOHLCV(firstTimeframe.ohlcv) : null

        return (
          <div key={symbolIdx} className="space-y-4">
            {/* Market Overview Card */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{symbolData.symbol}</span>
                      <Badge variant="outline">{symbolData.markets?.length || 0} Markets</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{formatPrice(stats.currentPrice)}</div>
                      <div className={`flex items-center gap-1 text-sm ${stats.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {stats.priceChange.toFixed(2)}%
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        24h High
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatPrice(stats.high24h)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingDown className="h-4 w-4" />
                        24h Low
                      </div>
                      <div className="text-lg font-semibold text-red-600">
                        {formatPrice(stats.low24h)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        24h Volume
                      </div>
                      <div className="text-lg font-semibold">
                        {formatVolume(stats.volume24h)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        Spread
                      </div>
                      <div className="text-lg font-semibold">
                        {((stats.high24h - stats.low24h) / stats.low24h * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Latest OHLCV Bar Summary */}
                  {latestBar && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-semibold mb-2">Latest Candle ({formatTimestamp(latestBar[0])})</div>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">Open</div>
                          <div className="font-mono">{formatPrice(latestBar[1])}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">High</div>
                          <div className="font-mono text-green-600">{formatPrice(latestBar[2])}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Low</div>
                          <div className="font-mono text-red-600">{formatPrice(latestBar[3])}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Close</div>
                          <div className="font-mono">{formatPrice(latestBar[4])}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Volume</div>
                          <div className="font-mono text-muted-foreground">{formatVolume(latestBar[5])}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Detailed OHLCV Data by Market and Timeframe */}
            <Card>
              <CardHeader>
                <CardTitle>Market Data Details</CardTitle>
                <CardDescription>
                  Complete OHLCV data across different markets and timeframes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="0" className="w-full">
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${symbolData.markets?.length || 1}, 1fr)` }}>
                    {symbolData.markets?.map((market, marketIdx) => (
                      <TabsTrigger key={marketIdx} value={marketIdx.toString()}>
                        {market.market_type}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {symbolData.markets?.map((market, marketIdx) => (
                    <TabsContent key={marketIdx} value={marketIdx.toString()} className="space-y-4">
                      {market.timeframes?.map((timeframe, tfIdx) => (
                        <div key={tfIdx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">
                              Timeframe: {timeframe.timeframe}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={timeframe.confidence_score >= 80 ? "default" : "secondary"}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Confidence: {timeframe.confidence_score}%
                              </Badge>
                              {timeframe.notes && (
                                <span className="text-xs text-muted-foreground">
                                  {timeframe.notes}
                                </span>
                              )}
                            </div>
                          </div>

                          {timeframe.ohlcv && timeframe.ohlcv.length > 0 ? (
                            <div className="rounded-md border overflow-hidden">
                              <div className="max-h-96 overflow-y-auto">
                                <Table>
                                  <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                      <TableHead>Time</TableHead>
                                      <TableHead className="text-right">Open</TableHead>
                                      <TableHead className="text-right">High</TableHead>
                                      <TableHead className="text-right">Low</TableHead>
                                      <TableHead className="text-right">Close</TableHead>
                                      <TableHead className="text-right">Volume</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {timeframe.ohlcv.slice(-20).map((bar: number[], barIdx: number) => (
                                      <TableRow key={barIdx}>
                                        <TableCell className="font-mono text-xs">
                                          {formatTimestamp(bar[0])}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs">
                                          {formatPrice(bar[1])}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-green-600">
                                          {formatPrice(bar[2])}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-red-600">
                                          {formatPrice(bar[3])}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs">
                                          {formatPrice(bar[4])}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                          {formatVolume(bar[5])}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="p-2 bg-muted text-xs text-muted-foreground text-center">
                                Showing last 20 of {timeframe.ohlcv.length} bars
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No OHLCV data available
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )
      })}

      {(!results.symbols || results.symbols.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No market data available
          </CardContent>
        </Card>
      )}
    </div>
  )
}
