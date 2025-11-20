import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface OrderBookEntry {
  price: number
  amount: number
  total: number
}

interface OrderBook {
  symbol: string
  spread: number
  spreadPercent: number
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

export const useBitgetOrderBook = (symbol: string) => {
  return useQuery({
    queryKey: ['bitget-orderbook', symbol],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-bitget-orderbook', {
        body: { symbol }
      })

      if (error) throw error
      return data as OrderBook
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: !!symbol
  })
}
