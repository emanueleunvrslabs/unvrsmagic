import { Activity } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import "@/components/labs/SocialMediaCard.css"

interface Ticker {
  symbol: string
  shortName: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
}

interface MktDataLiveTickersProps {
  tickers: Ticker[]
}

export const MktDataLiveTickers = ({ tickers }: MktDataLiveTickersProps) => {
  const formatPrice = (price: number | null | undefined) => {
    if (price == null || isNaN(price)) return '$0.00'
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  const formatVolume = (volume: number | null | undefined) => {
    if (volume == null || isNaN(volume)) return '$0.00M'
    return `$${(volume / 1000000).toFixed(2)}M`
  }

  return (
    <div className="labs-client-card relative rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="relative p-5 z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Live Tickers</h3>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3 pr-4">
            {tickers.map((ticker) => {
              const isPositive = ticker.change24h >= 0
              const initial = ticker.shortName.substring(0, 2)
              
              return (
                <div 
                  key={ticker.symbol}
                  className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{initial}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{ticker.symbol}</p>
                        <p className="text-xs text-gray-400">{ticker.shortName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{formatPrice(ticker.price)}</p>
                      <p className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{(ticker.change24h || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400">24h Vol</p>
                      <p className="font-medium text-white">{formatVolume(ticker.volume24h)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">24h High</p>
                      <p className="font-medium text-green-500">{formatPrice(ticker.high24h)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">24h Low</p>
                      <p className="font-medium text-red-500">{formatPrice(ticker.low24h)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
