import { useEffect, useState } from 'react'
import { supabase } from "@/integrations/supabase/client"

export interface BitgetOHLCVBar {
  timestamp_ms: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export const useBitgetHistoricalData = (symbol: string, timeframe: '1h' | '4h' | '1d', lookbackBars: number = 500) => {
  const [data, setData] = useState<BitgetOHLCVBar[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase.functions.invoke('bitget-historical-candles', {
          body: {
            symbol,
            timeframe,
            lookback_bars: lookbackBars,
          },
        })

        if (error) {
          console.error('[MKT.DATA][FRONTEND] Bitget historical function error:', error)
          setError(error.message)
          return
        }

        const payload = data as { success?: boolean; ohlcv?: BitgetOHLCVBar[]; error?: string }

        if (!payload?.success || !payload.ohlcv) {
          console.error('[MKT.DATA][FRONTEND] Invalid payload from historical function:', payload)
          setError(payload?.error || 'Unknown error from historical function')
          return
        }

        setData(payload.ohlcv)
      } catch (err) {
        console.error('[MKT.DATA][FRONTEND] Failed to fetch Bitget candles via function:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [symbol, timeframe, lookbackBars])

  return { data, isLoading, error }
}
