import { corsHeaders } from '../_shared/cors.ts'

interface MktHistoricalInput {
  symbol: string
  timeframe: string
  lookback_bars?: number
}

interface OHLCVBar {
  timestamp_ms: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Bitget API v2 valid granularities: 1min,3min,5min,15min,30min,1h,4h,6h,12h,1day,1week,1M
const timeframeMap: Record<string, string> = {
  '1m': '1min',
  '3m': '3min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '4h': '4h',
  '6h': '6h',
  '12h': '12h',
  '1d': '1day',
  '1w': '1week',
  '1M': '1M',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const input: MktHistoricalInput = await req.json()

    if (!input.symbol || !input.timeframe) {
      return new Response(
        JSON.stringify({ error: 'symbol and timeframe are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const bitgetGranularity = timeframeMap[input.timeframe] || '1H'
    const limit = Math.min(input.lookback_bars || 500, 1000)

    const url = `https://api.bitget.com/api/v2/spot/market/candles?symbol=${input.symbol}&granularity=${bitgetGranularity}&limit=${limit}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'locale': 'en-US',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[MKT.DATA][HISTORICAL] Bitget API error:', errorText)
      return new Response(
        JSON.stringify({ error: `Bitget error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const json = await response.json()

    if (json.code !== '00000') {
      console.error('[MKT.DATA][HISTORICAL] Bitget returned error code', json.code, json.msg)
      return new Response(
        JSON.stringify({ error: json.msg || 'Bitget error', code: json.code }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const candles = (json.data || []) as string[][]

    const ohlcv: OHLCVBar[] = candles.map((candle) => ({
      timestamp_ms: parseInt(candle[0]),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5] ?? '0'),
    }))

    // Bitget returns most recent first, reverse to chronological order
    const ordered = ohlcv.reverse()

    return new Response(
      JSON.stringify({ success: true, ohlcv: ordered }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MKT.DATA][HISTORICAL] Failed to fetch Bitget candles:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
