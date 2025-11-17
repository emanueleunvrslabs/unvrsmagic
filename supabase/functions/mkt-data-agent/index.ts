import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface MktDataInput {
  symbols: string[]
  timeframes: string[]
  lookback_bars: number
  data_sources: string
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

    // Fetch API keys from database
    const { data: apiKeys, error: apiError } = await supabaseClient
      .from('api_keys')
      .select('provider, api_key')
      .eq('user_id', user.id)
      .in('provider', ['coingecko', 'coinmarketcap'])

    if (apiError) {
      console.error('Error fetching API keys:', apiError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch API keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const coinGeckoKey = apiKeys?.find(k => k.provider === 'coingecko')?.api_key
    const coinMarketCapKey = apiKeys?.find(k => k.provider === 'coinmarketcap')?.api_key

    const output = {
      data_sources_used: [] as any[],
      symbols: [] as any[],
      errors: [] as any[]
    }

    // Process each symbol
    for (const symbol of input.symbols) {
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

        // Fetch data from CoinGecko if available
        if (coinGeckoKey) {
          try {
            const coinId = await getCoinGeckoId(symbol, coinGeckoKey)
            if (coinId) {
              output.data_sources_used.push({
                name: 'coingecko',
                notes: 'Market data from CoinGecko API'
              })

              for (const timeframe of input.timeframes) {
                const days = getTimeframeDays(timeframe, input.lookback_bars)
                const response = await fetch(
                  `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
                  {
                    headers: {
                      'x-cg-pro-api-key': coinGeckoKey
                    }
                  }
                )

                if (response.ok) {
                  const data = await response.json()
                  const ohlcv = normalizeCoingeckoData(data, timeframe, input.lookback_bars)
                  
                  marketData.timeframes.push({
                    timeframe,
                    ohlcv,
                    confidence_score: 85,
                    notes: 'Data from CoinGecko'
                  })
                } else {
                  output.errors.push({
                    symbol,
                    market_type: marketType,
                    timeframe,
                    message: `CoinGecko API error: ${response.status}`
                  })
                }
              }
            }
          } catch (error) {
            output.errors.push({
              symbol,
              market_type: marketType,
              message: `CoinGecko error: ${error instanceof Error ? error.message : String(error)}`
            })
          }
        }

        // Fetch data from CoinMarketCap if available
        if (coinMarketCapKey && marketData.timeframes.length === 0) {
          try {
            output.data_sources_used.push({
              name: 'coinmarketcap',
              notes: 'Market data from CoinMarketCap API'
            })

            const cmcSymbol = symbol.replace('USDT', '').replace('USD', '')
            const response = await fetch(
              `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmcSymbol}`,
              {
                headers: {
                  'X-CMC_PRO_API_KEY': coinMarketCapKey
                }
              }
            )

            if (response.ok) {
              const data = await response.json()
              
              for (const timeframe of input.timeframes) {
                const ohlcv = normalizeCoinMarketCapData(data, cmcSymbol)
                
                marketData.timeframes.push({
                  timeframe,
                  ohlcv,
                  confidence_score: 75,
                  notes: 'Snapshot data from CoinMarketCap (limited historical data)'
                })
              }
            } else {
              output.errors.push({
                symbol,
                market_type: marketType,
                message: `CoinMarketCap API error: ${response.status}`
              })
            }
          } catch (error) {
            output.errors.push({
              symbol,
              market_type: marketType,
              message: `CoinMarketCap error: ${error instanceof Error ? error.message : String(error)}`
            })
          }
        }

        if (marketData.timeframes.length > 0) {
          symbolData.markets.push(marketData)
        }
      }

      if (symbolData.markets.length > 0) {
        output.symbols.push(symbolData)
      } else {
        output.errors.push({
          symbol,
          message: 'No data available from configured sources'
        })
      }
    }

    // Remove duplicates from data_sources_used
    output.data_sources_used = Array.from(
      new Map(output.data_sources_used.map(item => [item.name, item])).values()
    )

    return new Response(
      JSON.stringify(output),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in mkt-data-agent:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions
async function getCoinGeckoId(symbol: string, apiKey: string): Promise<string | null> {
  try {
    const searchSymbol = symbol.replace('USDT', '').replace('USD', '').toLowerCase()
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${searchSymbol}`,
      {
        headers: {
          'x-cg-pro-api-key': apiKey
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.coins && data.coins.length > 0) {
        return data.coins[0].id
      }
    }
  } catch (error) {
    console.error('Error getting CoinGecko ID:', error)
  }
  return null
}

function getTimeframeDays(timeframe: string, lookbackBars: number): number {
  const timeframeMap: Record<string, number> = {
    '1m': lookbackBars / (24 * 60),
    '5m': lookbackBars / (24 * 12),
    '15m': lookbackBars / (24 * 4),
    '1h': lookbackBars / 24,
    '4h': lookbackBars / 6,
    '1d': lookbackBars
  }
  return Math.ceil(timeframeMap[timeframe] || lookbackBars)
}

function normalizeCoingeckoData(data: any, timeframe: string, lookbackBars: number): any[] {
  if (!data.prices || data.prices.length === 0) {
    return []
  }

  const prices = data.prices.slice(-lookbackBars)
  const volumes = data.total_volumes?.slice(-lookbackBars) || []

  return prices.map((price: any, index: number) => {
    const timestamp = price[0]
    const close = price[1]
    const volume = volumes[index] ? volumes[index][1] : 0

    // For CoinGecko, we approximate OHLC from close prices
    const open = index > 0 ? prices[index - 1][1] : close
    const high = Math.max(open, close) * 1.005 // Approximate high
    const low = Math.min(open, close) * 0.995  // Approximate low

    return [timestamp, open, high, low, close, volume]
  })
}

function normalizeCoinMarketCapData(data: any, symbol: string): any[] {
  if (!data.data || !data.data[symbol]) {
    return []
  }

  const quote = data.data[symbol].quote.USD
  const timestamp = new Date(data.data[symbol].last_updated).getTime()
  const price = quote.price
  const volume = quote.volume_24h

  // CMC provides only current snapshot, so we return single bar
  return [[timestamp, price, price, price, price, volume]]
}
