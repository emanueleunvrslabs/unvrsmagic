import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MktDataResultsProps {
  results: any
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
            {results.data_sources_used?.map((source: any, idx: number) => (
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
              {results.errors.map((error: any, idx: number) => (
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
      {results.symbols?.map((symbolData: any, symbolIdx: number) => (
        <Card key={symbolIdx}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{symbolData.symbol}</span>
              <Badge variant="outline">{symbolData.markets?.length || 0} Markets</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${symbolData.markets?.length || 1}, 1fr)` }}>
                {symbolData.markets?.map((market: any, marketIdx: number) => (
                  <TabsTrigger key={marketIdx} value={marketIdx.toString()}>
                    {market.market_type}
                  </TabsTrigger>
                ))}
              </TabsList>

              {symbolData.markets?.map((market: any, marketIdx: number) => (
                <TabsContent key={marketIdx} value={marketIdx.toString()} className="space-y-4">
                  {market.timeframes?.map((timeframe: any, tfIdx: number) => (
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
      ))}

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
