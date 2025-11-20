import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp, Database } from "lucide-react"
import { useMktData } from "@/hooks/use-mkt-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MktDataSymbolSelector } from "./mkt-data-symbol-selector"
import { MktDataChart } from "./mkt-data-chart"
import { MktDataActivityLogs } from "./mkt-data-activity-logs"
import { MktDataLiveTickers } from "./mkt-data-live-tickers"
import { MktDataOrderBook } from "./mkt-data-order-book"

const TOP_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BGBUSDT', 'XRPUSDT', 
  'USDCUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT'
]

export const MktDataInterface = () => {
  const { data, isLoading, error, initializeConfig } = useMktData()
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')

  useEffect(() => {
    initializeConfig()
  }, [])

  // Get selected symbol data
  const selectedData = data.find(d => d.symbol === selectedSymbol && d.timeframe === '1h')
  const ohlcvData = selectedData?.ohlcv as any[] || []
  
  // Mock data for demonstration (will be replaced with real data)
  const chartData = ohlcvData.slice(-24).map((candle: any) => ({
    timestamp: candle[0],
    price: candle[4] // close price
  }))

  const currentPrice = ohlcvData[ohlcvData.length - 1]?.[4] || 91774.58
  const priceChange = 0.17
  const volume24h = 0.01

  const activityLogs = [
    {
      id: '1',
      type: 'orderbook' as const,
      symbol: 'BTCUSDT',
      details: '📊 Depth: 20 levels',
      timestamp: '12:32:40',
      duration: '1029ms',
      status: 'success' as const
    },
    {
      id: '2',
      type: 'candles' as const,
      symbol: 'BTCUSDT',
      details: '📊 Records: 24 • Timeframe: 1h',
      timestamp: '12:32:39',
      duration: '619ms',
      status: 'success' as const
    },
    {
      id: '3',
      type: 'tickers' as const,
      symbol: 'Multiple',
      details: '📊 Records: 791 • Pairs: LINKUSDT, UNIUSDT, SUSHIUSDT, COMPUSDT, AAVEUSDT',
      timestamp: '12:32:38',
      duration: '822ms',
      status: 'success' as const
    },
    {
      id: '4',
      type: 'orderbook' as const,
      symbol: 'BTCUSDT',
      details: '📊 Depth: 20 levels',
      timestamp: '22:00:36',
      duration: '687ms',
      status: 'success' as const
    }
  ]

  const liveTickers = [
    { symbol: 'BTC/USDT', shortName: 'BTC', price: 91618.63, change24h: 0.11, volume24h: 668540000, high24h: 93166.67, low24h: 88611.72 },
    { symbol: 'ETH/USDT', shortName: 'ETH', price: 3006.82, change24h: -2.58, volume24h: 378940000, high24h: 3109.17, low24h: 2873.57 },
    { symbol: 'SOL/USDT', shortName: 'SOL', price: 141.83, change24h: 2.04, volume24h: 87090000, high24h: 144.78, low24h: 130.53 }
  ]

  const orderBook = {
    symbol: 'BTC',
    spread: 0.01,
    spreadPercent: 0.0001,
    bids: Array.from({ length: 15 }, (_, i) => ({
      price: 91618.64 - i * 0.01,
      amount: 0.01 + Math.random() * 0.7,
      total: (91618.64 - i * 0.01) * (0.01 + Math.random() * 0.7)
    })),
    asks: Array.from({ length: 15 }, (_, i) => ({
      price: 91619.75 + i * 0.01,
      amount: 0.01 + Math.random() * 0.7,
      total: (91619.75 + i * 0.01) * (0.01 + Math.random() * 0.7)
    }))
  }

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
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Symbol Selector */}
          <div className="col-span-2">
            <Card>
              <CardContent className="pt-6">
                <MktDataSymbolSelector
                  symbols={TOP_SYMBOLS}
                  selectedSymbol={selectedSymbol}
                  onSymbolChange={setSelectedSymbol}
                />
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="col-span-6">
            <MktDataChart
              symbol={selectedSymbol}
              data={chartData}
              currentPrice={currentPrice}
              priceChange={priceChange}
              volume24h={volume24h}
            />
          </div>

          {/* Activity Logs */}
          <div className="col-span-4">
            <MktDataActivityLogs logs={activityLogs} />
          </div>

          {/* Live Tickers */}
          <div className="col-span-4">
            <MktDataLiveTickers tickers={liveTickers} />
          </div>

          {/* Order Book */}
          <div className="col-span-8">
            <MktDataOrderBook {...orderBook} />
          </div>
        </div>
      )}
    </div>
  )
}
