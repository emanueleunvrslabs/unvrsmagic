import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface MktDataInput {
  symbols: string[]
  timeframes: string[]
  lookback_bars: number
  market_types: string[]
}

interface OHLCVBar {
  timestamp_ms: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface BitgetCandleResponse {
  code: string
  msg: string
  data: string[][] // [timestamp, open, high, low, close, volume, quoteVolume]
}

// Map timeframes to Bitget granularity
const timeframeMap: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '4h': '4H',
  '12h': '12H',
  '1d': '1D',
  '1w': '1W'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const input: MktDataInput = await req.json()
    
    // Validate input
    if (!input.symbols || !Array.isArray(input.symbols) || input.symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'symbols array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[MKT.DATA][INFO] Starting data collection for ${input.symbols.length} symbols`)

    const output = {
      data_sources_used: ['bitget'],
      symbols: [] as any[],
      errors: [] as any[]
    }

    // Process each symbol
    for (const symbol of input.symbols) {
      try {
        console.log(`[MKT.DATA][INFO] Processing ${symbol}`)
        
        const symbolData = {
          symbol,
          markets: [] as any[]
        }

        // Fetch data for each market type
        for (const marketType of input.market_types || ['spot']) {
          const marketData = {
            market_type: marketType,
            timeframes: [] as any[]
          }

          // Fetch data for each timeframe
          for (const timeframe of input.timeframes) {
            try {
              const bitgetGranularity = timeframeMap[timeframe] || '1H'
              const limit = Math.min(input.lookback_bars || 500, 1000) // Bitget max is 1000
              
              console.log(`[MKT.DATA][DEBUG] Fetching ${symbol} ${timeframe} from Bitget (${limit} bars)`)

              const url = `https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=${bitgetGranularity}&limit=${limit}`
              
              const response = await fetch(url, {
                headers: {
                  'Content-Type': 'application/json',
                  'locale': 'en-US'
                }
              })

              if (!response.ok) {
                const errorText = await response.text()
                console.error(`[MKT.DATA][ERROR] Bitget API error for ${symbol}:`, errorText)
                
                // Check if symbol doesn't exist
                try {
                  const errorJson = JSON.parse(errorText)
                  if (errorJson.code === '40034' || errorJson.code === '40309') {
                    console.log(`[MKT.DATA][INFO] Symbol ${symbol} not available on Bitget, skipping`)
                    continue
                  }
                } catch (_) {
                  // Continue with generic error handling
                }
                
                output.errors.push({
                  symbol,
                  timeframe,
                  market_type: marketType,
                  error: `Bitget API error: ${response.status}`
                })
                continue
              }

              const data: BitgetCandleResponse = await response.json()

              if (data.code !== '00000') {
                console.error(`[MKT.DATA][ERROR] Bitget returned error code ${data.code} for ${symbol}:`, data.msg)
                
                // Skip unavailable symbols
                if (data.code === '40034' || data.code === '40309') {
                  console.log(`[MKT.DATA][INFO] Symbol ${symbol} not available on Bitget, skipping`)
                  continue
                }
                
                output.errors.push({
                  symbol,
                  timeframe,
                  market_type: marketType,
                  error: data.msg
                })
                continue
              }

              // Transform Bitget candles to our OHLCV format
              const ohlcv: OHLCVBar[] = data.data.map(candle => ({
                timestamp_ms: parseInt(candle[0]),
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5])
              }))

              console.log(`[MKT.DATA][INFO] Retrieved ${ohlcv.length} candles for ${symbol} ${timeframe}`)

              // Save to database
              const { error: saveError } = await supabaseClient
                .from('mkt_data_results')
                .upsert({
                  user_id: user.id,
                  symbol,
                  market_type: marketType,
                  timeframe,
                  ohlcv,
                  data_sources: ['bitget'],
                  confidence_score: 95,
                  notes: `Data from Bitget API (${ohlcv.length} bars)`
                }, {
                  onConflict: 'user_id,symbol,market_type,timeframe'
                })

              if (saveError) {
                console.error(`[MKT.DATA][ERROR] Error saving data for ${symbol}:`, saveError)
                output.errors.push({
                  symbol,
                  timeframe,
                  market_type: marketType,
                  error: saveError.message
                })
                continue
              }

              marketData.timeframes.push({
                timeframe,
                bars_collected: ohlcv.length,
                confidence_score: 95,
                notes: 'Data from Bitget'
              })

            } catch (timeframeError) {
              console.error(`[MKT.DATA][ERROR] Error processing ${symbol} ${timeframe}:`, timeframeError)
              output.errors.push({
                symbol,
                timeframe,
                market_type: marketType,
                error: timeframeError instanceof Error ? timeframeError.message : 'Unknown error'
              })
            }
          }

          if (marketData.timeframes.length > 0) {
            symbolData.markets.push(marketData)
          }
        }

        if (symbolData.markets.length > 0) {
          output.symbols.push(symbolData)
        }

      } catch (symbolError) {
        console.error(`[MKT.DATA][ERROR] Error processing symbol ${symbol}:`, symbolError)
        output.errors.push({
          symbol,
          error: symbolError instanceof Error ? symbolError.message : 'Unknown error'
        })
      }
    }

    console.log(`[MKT.DATA][INFO] Completed. Processed ${output.symbols.length} symbols with ${output.errors.length} errors`)

    return new Response(JSON.stringify({
      success: true,
      ...output
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[MKT.DATA][ERROR] Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
