import { ArrowDown, ArrowUp } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import "@/components/labs/SocialMediaCard.css"

interface OrderBookEntry {
  price: number
  amount: number
  total: number
}

interface MktDataOrderBookProps {
  symbol: string
  spread: number
  spreadPercent: number
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

export const MktDataOrderBook = ({ symbol, spread, spreadPercent, bids, asks }: MktDataOrderBookProps) => {
  const formatPrice = (price: number) => price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatAmount = (amount: number) => amount.toFixed(4)
  const formatTotal = (total: number) => `$${total.toLocaleString()}`

  return (
    <div className="labs-client-card relative rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="relative p-5 z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Order Book</h3>
          <div className="text-right">
            <p className="text-xs text-gray-400">Spread</p>
            <p className="text-sm font-medium text-white">${spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)</p>
          </div>
        </div>
        <div className="space-y-2 flex-1">
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 pb-2 border-b border-white/10">
            <span>Price (USDT)</span>
            <span className="text-right">Amount ({symbol.replace('USDT', '')})</span>
            <span className="text-right">Total</span>
          </div>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {asks.slice(0, 10).reverse().map((ask, idx) => (
                <div key={`ask-${idx}`} className="grid grid-cols-3 gap-2 text-xs hover:bg-red-500/10 rounded px-1 py-0.5">
                  <span className="text-red-500 font-medium">{formatPrice(ask.price)}</span>
                  <span className="text-right text-white/80">{formatAmount(ask.amount)}</span>
                  <span className="text-right text-gray-400">{formatTotal(ask.total)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-center gap-4 py-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-red-500" />
              <span className="text-xl font-bold text-white">${formatPrice(bids[0]?.price || 0)}</span>
              <ArrowUp className="h-4 w-4 text-green-500" />
            </div>
          </div>

          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {bids.slice(0, 10).map((bid, idx) => (
                <div key={`bid-${idx}`} className="grid grid-cols-3 gap-2 text-xs hover:bg-green-500/10 rounded px-1 py-0.5">
                  <span className="text-green-500 font-medium">{formatPrice(bid.price)}</span>
                  <span className="text-right text-white/80">{formatAmount(bid.amount)}</span>
                  <span className="text-right text-gray-400">{formatTotal(bid.total)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
