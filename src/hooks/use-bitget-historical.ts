import { useEffect, useState } from 'react'

export interface BitgetOHLCVBar {
  timestamp_ms: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const timeframeMap: Record<string, string> = {
  '1h': '1H',
  '4h': '4H',
  '1d': '1D',
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

        const bitgetGranularity = timeframeMap[timeframe] || '1H'
        const limit = Math.min(lookbackBars, 1000)

        const url = `https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=${bitgetGranularity}&limit=${limit}`

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'locale': 'en-US',
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[MKT.DATA][FRONTEND] Bitget API error:', errorText)
          setError(`Bitget error: ${response.status}`)
          return
        }

        const json = await response.json()

        if (json.code !== '00000') {
          console.error('[MKT.DATA][FRONTEND] Bitget returned error code', json.code, json.msg)
          setError(json.msg || 'Bitget error')
          return
        }

        const candles = (json.data || []) as string[][]

        const ohlcv: BitgetOHLCVBar[] = candles.map((candle) => ({
          timestamp_ms: parseInt(candle[0]),
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5] ?? '0'),
        }))

        // Bitget returns most recent first, reverse to chronological order
        setData(ohlcv.reverse())
      } catch (err) {
        console.error('[MKT.DATA][FRONTEND] Failed to fetch Bitget candles:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [symbol, timeframe, lookbackBars])

  return { data, isLoading, error }
}
