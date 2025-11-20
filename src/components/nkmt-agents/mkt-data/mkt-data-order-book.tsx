import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order Book</CardTitle>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Spread</p>
            <p className="text-sm font-medium">${spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pb-2 border-b">
            <span>Price (USDT)</span>
            <span className="text-right">Amount ({symbol.replace('USDT', '')})</span>
            <span className="text-right">Total</span>
          </div>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {asks.slice(0, 10).reverse().map((ask, idx) => (
                <div key={`ask-${idx}`} className="grid grid-cols-3 gap-2 text-xs hover:bg-red-500/5 rounded px-1 py-0.5">
                  <span className="text-red-500 font-medium">{formatPrice(ask.price)}</span>
                  <span className="text-right">{formatAmount(ask.amount)}</span>
                  <span className="text-right text-muted-foreground">{formatTotal(ask.total)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-center gap-4 py-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-red-500" />
              <span className="text-xl font-bold">${formatPrice(bids[0]?.price || 0)}</span>
              <ArrowUp className="h-4 w-4 text-green-500" />
            </div>
          </div>

          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {bids.slice(0, 10).map((bid, idx) => (
                <div key={`bid-${idx}`} className="grid grid-cols-3 gap-2 text-xs hover:bg-green-500/5 rounded px-1 py-0.5">
                  <span className="text-green-500 font-medium">{formatPrice(bid.price)}</span>
                  <span className="text-right">{formatAmount(bid.amount)}</span>
                  <span className="text-right text-muted-foreground">{formatTotal(bid.total)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
