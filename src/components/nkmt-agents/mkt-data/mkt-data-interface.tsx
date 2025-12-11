import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, TrendingUp, Database, FileText, RefreshCw } from "lucide-react"
import "@/components/labs/SocialMediaCard.css"
import { useMktData, parseOhlcv } from "@/hooks/use-mkt-data"
import type { OHLCVBar } from "@/hooks/use-mkt-data"
import { useBitgetOrderBook } from "@/hooks/use-bitget-orderbook"
import { useTriggerMktData } from "@/hooks/use-trigger-mkt-data"
import { useBitgetHistoricalData } from "@/hooks/use-bitget-historical"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MktDataSymbolSelector } from "./mkt-data-symbol-selector"
import { MktDataChart } from "./mkt-data-chart"
import { NKMTLogsViewer } from "../nkmt-dashboard/nkmt-logs-viewer"
import { MktDataLiveTickers } from "./mkt-data-live-tickers"
import { MktDataOrderBook } from "./mkt-data-order-book"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { applyIndicators } from "@/lib/technical-indicators"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const TOP_SYMBOLS_FALLBACK = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BGBUSDT', 'XRPUSDT', 
  'USDCUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT'
]
 
export const MktDataInterface = () => {
  const { data, isLoading, error, initializeConfig, lastUpdatedSymbol } = useMktData()
  const { triggerDataCollection, isTriggering } = useTriggerMktData()
  const availableSymbols = Array.from(new Set(data.map(d => d.symbol)))
  const symbols = availableSymbols.length > 0 ? availableSymbols : TOP_SYMBOLS_FALLBACK
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0] || 'BTCUSDT')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '1d'>('1h')
  const [indicators, setIndicators] = useState({
    sma20: false,
    sma50: false,
    ema12: false,
    ema26: false,
    rsi: false,
    macd: false
  })

  // Aggiorna automaticamente il grafico per mostrare la moneta analizzata
  useEffect(() => {
    if (lastUpdatedSymbol) {
      setSelectedSymbol(lastUpdatedSymbol)
    }
  }, [lastUpdatedSymbol])

  // Fetch real order book data from Bitget
  const { data: orderBookData, isLoading: orderBookLoading } = useBitgetOrderBook(selectedSymbol)

  // Fetch storico direttamente da Bitget se il database ha poche candele
  const { data: bitgetHistorical, isLoading: bitgetLoading } = useBitgetHistoricalData(
    selectedSymbol,
    selectedTimeframe,
    500
  )

  useEffect(() => {
    initializeConfig()
  }, [])

  // Get all data for the selected symbol (all timeframes and market types)
  const symbolData = data.filter(d => d.symbol === selectedSymbol)
  
  // Get data for the selected timeframe and prioritize spot market
  const chartSourceData = symbolData.find(d => d.timeframe === selectedTimeframe && d.market_type === 'spot') || symbolData[0]
  
  // Extract OHLCV data from backend
  const dbOhlcvArray = chartSourceData ? parseOhlcv(chartSourceData.ohlcv) : []

  // Choose the best source: if backend has less than 10 candles, use Bitget
  const ohlcvArray: OHLCVBar[] = dbOhlcvArray.length >= 10
    ? dbOhlcvArray
    : (bitgetHistorical as OHLCVBar[]) || []
  
  // Calculate technical indicators
  const technicalIndicators = ohlcvArray.length > 0 ? applyIndicators(
    ohlcvArray.map((c) => ({
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume || 0,
      timestamp: c.timestamp_ms
    })),
    {
      sma: indicators.sma20 || indicators.sma50 ? [
        ...(indicators.sma20 ? [20] : []),
        ...(indicators.sma50 ? [50] : [])
      ] : undefined,
      ema: indicators.ema12 || indicators.ema26 ? [
        ...(indicators.ema12 ? [12] : []),
        ...(indicators.ema26 ? [26] : [])
      ] : undefined,
      rsi: indicators.rsi,
      macd: indicators.macd
    }
  ) : { sma: {}, ema: {}, rsi: null, macd: null }
  
  const chartData = ohlcvArray.map((candle, idx: number) => ({
    timestamp: candle.timestamp_ms,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    sma20: technicalIndicators.sma[20]?.[idx],
    sma50: technicalIndicators.sma[50]?.[idx],
    ema12: technicalIndicators.ema[12]?.[idx],
    ema26: technicalIndicators.ema[26]?.[idx],
    rsi: technicalIndicators.rsi?.[idx],
    macd: technicalIndicators.macd?.macd[idx],
    macdSignal: technicalIndicators.macd?.signal[idx],
    macdHistogram: technicalIndicators.macd?.histogram[idx]
  }))

  // Calculate metrics from OHLCV data
  const latestCandle = ohlcvArray[ohlcvArray.length - 1]
  const firstCandle = ohlcvArray[0]
  const currentPrice = latestCandle?.close || 0
  const priceChange = firstCandle?.close 
    ? ((currentPrice - firstCandle.close) / firstCandle.close) * 100 
    : 0
  const volume24h = ohlcvArray.reduce((sum: number, candle) => sum + (candle.volume || 0), 0) / 1000000

  // Get live ticker data from database
  const liveTickers = symbols.slice(0, 10).map(sym => {
    const symData = data.find(d => d.symbol === sym && d.timeframe === '1h' && d.market_type === 'spot')
    const ohlcv = symData ? parseOhlcv(symData.ohlcv) : []
    const latest = ohlcv[ohlcv.length - 1]
    const first = ohlcv[0]
    
    if (!latest) {
      return {
        symbol: sym,
        shortName: sym.replace('USDT', ''),
        price: 0,
        change24h: 0,
        volume24h: 0,
        high24h: 0,
        low24h: 0
      }
    }
 
    const change = first?.close ? ((latest.close - first.close) / first.close) * 100 : 0
    const high = Math.max(...ohlcv.map((c) => c.high || 0))
    const low = Math.min(...ohlcv.filter((c) => c.low > 0).map((c) => c.low || Infinity))
    const vol = ohlcv.reduce((sum: number, c) => sum + (c.volume || 0), 0) / 1000000
 
    return {
      symbol: sym,
      shortName: sym.replace('USDT', ''),
      price: latest.close,
      change24h: change,
      volume24h: vol,
      high24h: high,
      low24h: low === Infinity ? latest.close : low
    }
  })

  // Activity logs from recent updates
  const recentUpdates = data
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10)
  
  const activityLogs = recentUpdates.map((item, idx) => ({
    id: `log-${idx}`,
    type: 'candles' as const,
    symbol: item.symbol,
    details: `📊 Records: ${parseOhlcv(item.ohlcv).length} • Timeframe: ${item.timeframe} • ${item.market_type}`,
    timestamp: new Date(item.updated_at).toLocaleTimeString(),
    duration: `${item.confidence_score}% confidence`,
    status: 'success' as const
  }))

  // Generate mock order book as fallback if API call fails
  const basePrice = currentPrice || 91618
  const mockOrderBook = {
    symbol: selectedSymbol.replace('USDT', ''),
    spread: 0.01,
    spreadPercent: 0.0001,
    bids: Array.from({ length: 15 }, (_, i) => {
      const price = basePrice - i * 0.01
      const amount = 0.01 + Math.random() * 0.7
      return {
        price,
        amount,
        total: price * amount
      }
    }),
    asks: Array.from({ length: 15 }, (_, i) => {
      const price = basePrice + 1 + i * 0.01
      const amount = 0.01 + Math.random() * 0.7
      return {
        price,
        amount,
        total: price * amount
      }
    })
  }

  // Use real data if available, otherwise fall back to mock
  const orderBook = orderBookData || mockOrderBook
  const isSymbolNotAvailable = !orderBookLoading && !orderBookData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mkt.data Agent</h1>
          <p className="text-muted-foreground mt-2">
            Real-time market data collection for top cryptocurrencies
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={triggerDataCollection}
            disabled={isTriggering}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTriggering ? 'animate-spin' : ''}`} />
            {isTriggering ? 'Raccolta in corso...' : 'Raccogli Dati Ora'}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mkt.data Agent Prompt</DialogTitle>
                <DialogDescription>
                  System prompt used by the MKT.DATA agent
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold mb-2">Role</h3>
                <p className="text-sm text-muted-foreground">
                  Collect spot market OHLCV data for top 100 cryptocurrencies from CoinGecko and CoinMarketCap APIs.
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold mb-2">Parameters</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Timeframes: 1h, 4h, 1d</li>
                  <li>Lookback: 100 bars</li>
                  <li>Frequency: Every 5 minutes</li>
                  <li>Markets: Spot & Futures</li>
                </ul>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold mb-2">Output</h3>
                <p className="text-sm text-muted-foreground">
                  Stores normalized OHLCV data with confidence scores in mkt_data_results and notifies NKMT orchestrator.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative flex items-center gap-3 p-5 z-10">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Data Points</p>
              <p className="text-2xl font-bold text-white">{data.length}</p>
              <p className="text-xs text-gray-500">Total market data records</p>
            </div>
          </div>
        </div>

        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative flex items-center gap-3 p-5 z-10">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Symbols</p>
              <p className="text-2xl font-bold text-white">
                {new Set(data.map(d => d.symbol)).size}
              </p>
              <p className="text-xs text-gray-500">Unique trading pairs tracked</p>
            </div>
          </div>
        </div>

        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative flex items-center gap-3 p-5 z-10">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-2xl font-bold text-green-400">Active</p>
              <p className="text-xs text-gray-500">Auto-updating every 5 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && data.length === 0 ? (
        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative py-8 text-center z-10">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
            <p className="text-gray-400">Loading market data...</p>
          </div>
        </div>
      ) : data.length > 0 ? (
        <div className="space-y-6">
          {/* First row: Symbol Selector + Chart + Activity Logs */}
          <div className="grid grid-cols-12 gap-6">
            {/* Symbol Selector */}
            <div className="col-span-12 lg:col-span-2 flex">
              <div className="labs-client-card relative rounded-2xl overflow-hidden flex-1">
                <div className="relative p-5 z-10">
                  <MktDataSymbolSelector
                    symbols={symbols}
                    selectedSymbol={selectedSymbol}
                    onSymbolChange={setSelectedSymbol}
                  />
                </div>
              </div>
            </div>

            {/* Chart with Timeframe Selector */}
            <div className="col-span-12 lg:col-span-6 space-y-4 flex flex-col">
              {/* Timeframe and Indicators Selector */}
              <div className="labs-client-card relative rounded-2xl overflow-hidden">
                <div className="relative p-5 z-10 space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block text-white">Timeframe</Label>
                    <Tabs value={selectedTimeframe} onValueChange={(v) => setSelectedTimeframe(v as '1h' | '4h' | '1d')}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="1h">1H</TabsTrigger>
                        <TabsTrigger value="4h">4H</TabsTrigger>
                        <TabsTrigger value="1d">1D</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block text-white">Technical Indicators</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="sma20" 
                          checked={indicators.sma20}
                          onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, sma20: !!checked }))}
                        />
                        <Label htmlFor="sma20" className="text-xs cursor-pointer text-white/80">SMA 20</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="sma50" 
                          checked={indicators.sma50}
                          onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, sma50: !!checked }))}
                        />
                        <Label htmlFor="sma50" className="text-xs cursor-pointer text-white/80">SMA 50</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="ema12" 
                          checked={indicators.ema12}
                          onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, ema12: !!checked }))}
                        />
                        <Label htmlFor="ema12" className="text-xs cursor-pointer text-white/80">EMA 12</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="ema26" 
                          checked={indicators.ema26}
                          onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, ema26: !!checked }))}
                        />
                        <Label htmlFor="ema26" className="text-xs cursor-pointer text-white/80">EMA 26</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="rsi" 
                          checked={indicators.rsi}
                          onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, rsi: !!checked }))}
                        />
                        <Label htmlFor="rsi" className="text-xs cursor-pointer text-white/80">RSI</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="macd" 
                          checked={indicators.macd}
                          onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, macd: !!checked }))}
                        />
                        <Label htmlFor="macd" className="text-xs cursor-pointer text-white/80">MACD</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="flex-1">
                <MktDataChart
                  symbol={selectedSymbol}
                  data={chartData}
                  currentPrice={currentPrice}
                  priceChange={priceChange}
                  volume24h={volume24h}
                  indicators={indicators}
                  isLive={lastUpdatedSymbol === selectedSymbol}
                />
              </div>
            </div>

            {/* Agent Logs */}
            <div className="col-span-12 lg:col-span-4 flex">
              <div className="flex-1">
                <NKMTLogsViewer />
              </div>
            </div>
          </div>

          {/* Second row: Live Tickers + Order Book */}
          <div className="grid grid-cols-12 gap-6">
            {/* Live Tickers */}
            <div className="col-span-12 lg:col-span-4 flex">
              <div className="flex-1">
                <MktDataLiveTickers tickers={liveTickers} />
              </div>
            </div>

            {/* Order Book */}
            <div className="col-span-12 lg:col-span-8 flex">
              <div className="flex-1">
                {isSymbolNotAvailable ? (
                  <div className="labs-client-card relative rounded-2xl overflow-hidden h-full">
                    <div className="relative py-8 text-center z-10">
                      <p className="text-sm text-gray-400">Symbol {selectedSymbol} is not available on Bitget</p>
                      <p className="text-xs mt-2 text-gray-500">Please select another symbol</p>
                    </div>
                  </div>
                ) : (
                  <MktDataOrderBook {...orderBook} />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="labs-client-card relative rounded-2xl overflow-hidden">
          <div className="relative py-8 text-center z-10">
            <p className="text-gray-400">No market data available yet. The agent will start collecting data automatically.</p>
          </div>
        </div>
      )}
    </div>
  )
}
