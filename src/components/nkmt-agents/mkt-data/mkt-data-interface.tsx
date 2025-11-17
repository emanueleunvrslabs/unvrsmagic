import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Loader2, Play } from "lucide-react"
import { MktDataResults } from "./mkt-data-results"

export const MktDataInterface = () => {
  const [symbols, setSymbols] = useState("BTCUSDT,ETHUSDT")
  const [timeframes, setTimeframes] = useState("1h,4h")
  const [lookbackBars, setLookbackBars] = useState("100")
  const [marketTypes, setMarketTypes] = useState<string[]>(["spot"])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleExecute = async () => {
    if (!symbols.trim()) {
      toast.error("Please enter at least one symbol")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('mkt-data-agent', {
        body: {
          symbols: symbols.split(',').map(s => s.trim()),
          timeframes: timeframes.split(',').map(t => t.trim()),
          lookback_bars: parseInt(lookbackBars),
          data_sources: "coingecko,coinmarketcap,bitget",
          market_types: marketTypes
        }
      })

      if (error) {
        console.error('Error calling mkt-data-agent:', error)
        toast.error("Failed to fetch market data")
        return
      }

      setResults(data)
      toast.success("Market data retrieved successfully")
    } catch (error) {
      console.error('Error:', error)
      toast.error("An error occurred while fetching data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mkt.data Agent</h1>
        <p className="text-muted-foreground mt-2">
          Market data ingestion and normalization for cryptocurrency markets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure Data Request</CardTitle>
          <CardDescription>
            Specify symbols, timeframes, and market types to fetch OHLCV data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbols">Trading Symbols</Label>
              <Input
                id="symbols"
                placeholder="BTCUSDT,ETHUSDT,BNBUSDT"
                value={symbols}
                onChange={(e) => setSymbols(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of trading pairs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframes">Timeframes</Label>
              <Input
                id="timeframes"
                placeholder="1m,5m,15m,1h,4h,1d"
                value={timeframes}
                onChange={(e) => setTimeframes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list (e.g., 1m, 1h, 1d)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lookback">Lookback Bars</Label>
              <Input
                id="lookback"
                type="number"
                placeholder="100"
                value={lookbackBars}
                onChange={(e) => setLookbackBars(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Number of historical bars to fetch
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-type">Market Type</Label>
              <Select
                value={marketTypes[0]}
                onValueChange={(value) => setMarketTypes([value])}
              >
                <SelectTrigger id="market-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spot">Spot</SelectItem>
                  <SelectItem value="perpetual_futures">Perpetual Futures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleExecute} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Data...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Execute Agent
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && <MktDataResults results={results} />}
    </div>
  )
}
