import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"

interface MarketSummaryProps {
  pair: string
}

interface TickerData {
  lastPrice: number
  priceChangePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
}

export function MarketSummary({ pair }: MarketSummaryProps) {
  const [marketData, setMarketData] = useState<TickerData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchTickerData = async () => {
      if (!pair) return
      
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-bitget-ticker`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symbol: pair })
          }
        )

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setMarketData(result.data)
          }
        }
      } catch (error) {
        console.error('Error fetching ticker data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTickerData()
    // Refresh every 10 seconds
    const interval = setInterval(fetchTickerData, 10000)
    
    return () => clearInterval(interval)
  }, [pair])

  if (isLoading && !marketData) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Market Summary - {pair.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading market data...</div>
        </CardContent>
      </Card>
    )
  }

  if (!marketData) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Market Summary - {pair.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Select a trading pair to view market data</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Market Summary - {pair.toUpperCase()}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between flex-wrap grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <div className="text-sm text-muted-foreground">Last Price</div>
          <div className="text-lg font-medium">${marketData.lastPrice.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">24h Change</div>
          <div className={`text-lg font-medium ${marketData.priceChangePercent24h >= 0 ? "text-green-500" : "text-red-500"}`}>
            {marketData.priceChangePercent24h >= 0 ? "+" : ""}
            {marketData.priceChangePercent24h.toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">24h High</div>
          <div className="text-lg font-medium">${marketData.high24h.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">24h Low</div>
          <div className="text-lg font-medium">${marketData.low24h.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">24h Volume</div>
          <div className="text-lg font-medium">{marketData.volume24h.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
