import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Top 100 crypto symbols
const TOP_100_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT',
  'AVAXUSDT', 'LINKUSDT', 'DOTUSDT', 'MATICUSDT', 'SHIBUSDT', 'LTCUSDT', 'BCHUSDT', 'UNIUSDT',
  'ATOMUSDT', 'ETCUSDT', 'XLMUSDT', 'APTUSDT', 'FILUSDT', 'NEARUSDT', 'VETUSDT', 'ALGOUSDT',
  'ICPUSDT', 'HBARUSDT', 'QNTUSDT', 'AAVEUSDT', 'GRTUSDT', 'IMXUSDT', 'SANDUSDT', 'INJUSDT',
  'MANAUSDT', 'RNDRUSDT', 'MKRUSDT', 'LDOUSDT', 'FTMUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT',
  'PEPEUSDT', 'RUNEUSDT', 'BEAMUSDT', 'FLOWUSDT', 'AXSUSDT', 'CFXUSDT', 'TIAUSDT', 'STXUSDT',
  'FLOKIUSDT', 'WLDUSDT', 'SEIUSDT', 'CRVUSDT', 'SNXUSDT', 'GALAUSDT', 'CHZUSDT', 'BTCDOMUSDT',
  'ENJUSDT', 'PYTHUSDT', 'COMPUSDT', 'ONEUSDT', 'ZILUSDT', 'WAVESUSDT', 'KLAYUSDT', 'JUPUSDT',
  'MINAUSDT', 'CKBUSDT', 'ZECUSDT', 'DASHUSDT', 'BATUSDT', 'IOTAUSDT', 'OMGUSDT', 'CELRUSDT',
  'NKNUSDT', 'RVNUSDT', 'ZENUSDT', 'QTUMUSDT', 'ICXUSDT', 'THETAUSDT', 'XTZUSDT', 'ONTUSDT',
  'LRCUSDT', 'KAVAUSDT', 'BANDUSDT', 'COTIUSDT', 'RLCUSDT', 'BALUSDT', 'OCEANUSDT', 'YFIUSDT',
  '1INCHUSDT', 'SUSHIUSDT', 'YFIIUSDT', 'DYDXUSDT', 'ENSUSDT', 'WOOUSDT', 'CHRUSDT', 'JSTOMUSDT',
  'HNTUSDT', 'FXSUSDT', 'MOVRUSDT', 'TRBUSDT'
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verifica che la chiamata sia dal cron o abbia la service role key
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!authHeader || !authHeader.includes(serviceRoleKey || '')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Service role required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all users with enabled mkt_data_config
    const { data: configs, error: configError } = await supabaseClient
      .from('mkt_data_config')
      .select('*')
      .eq('enabled', true)

    if (configError) {
      console.error('Error fetching configs:', configError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch configurations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${configs?.length || 0} user configurations`)

    const results = []

    // Process each user configuration
    for (const config of configs || []) {
      try {
        // Fetch user's API keys
        const { data: apiKeys } = await supabaseClient
          .from('api_keys')
          .select('provider, api_key')
          .eq('user_id', config.user_id)
          .in('provider', ['coingecko', 'coinmarketcap'])

        if (!apiKeys || apiKeys.length === 0) {
          console.log(`No API keys found for user ${config.user_id}, skipping`)
          continue
        }

        const coinGeckoKey = apiKeys.find(k => k.provider === 'coingecko')?.api_key
        const coinMarketCapKey = apiKeys.find(k => k.provider === 'coinmarketcap')?.api_key

        // Use TOP 100 symbols
        const symbols = TOP_100_SYMBOLS
        const timeframes = config.timeframes || ['1h', '4h', '1d']
        const marketTypes = config.market_types || ['spot', 'futures']
        const lookbackBars = config.lookback_bars || 100

        console.log(`Processing user ${config.user_id} with ${symbols.length} symbols`)

        // Process data in batches to avoid timeouts
        const batchSize = 10
        for (let i = 0; i < symbols.length; i += batchSize) {
          const batchSymbols = symbols.slice(i, i + batchSize)
          
          for (const symbol of batchSymbols) {
            for (const marketType of marketTypes) {
              for (const timeframe of timeframes) {
                try {
                  let ohlcvData = null
                  let dataSource = null

                  // Try CoinGecko first
                  if (coinGeckoKey) {
                    const coinId = await getCoinGeckoId(symbol, coinGeckoKey)
                    if (coinId) {
                      const days = getTimeframeDays(timeframe, lookbackBars)
                      const response = await fetch(
                        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
                        { headers: { 'x-cg-pro-api-key': coinGeckoKey } }
                      )
                      
                      if (response.ok) {
                        const data = await response.json()
                        ohlcvData = normalizeCoingeckoData(data, timeframe, lookbackBars)
                        dataSource = 'coingecko'
                      }
                    }
                  }

                  // If no data from CoinGecko, try CoinMarketCap
                  if (!ohlcvData && coinMarketCapKey) {
                    const cmcSymbol = symbol.replace('USDT', '').replace('USD', '')
                    const response = await fetch(
                      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmcSymbol}`,
                      { headers: { 'X-CMC_PRO_API_KEY': coinMarketCapKey } }
                    )
                    
                    if (response.ok) {
                      const data = await response.json()
                      ohlcvData = normalizeCoinMarketCapData(data, cmcSymbol)
                      dataSource = 'coinmarketcap'
                    }
                  }

                  // Save to database if we have data
                  if (ohlcvData && ohlcvData.length > 0) {
                    const { error: insertError } = await supabaseClient
                      .from('mkt_data_results')
                      .upsert({
                        user_id: config.user_id,
                        symbol,
                        market_type: marketType,
                        timeframe,
                        ohlcv: ohlcvData,
                        data_sources: [dataSource],
                        confidence_score: dataSource === 'coingecko' ? 85 : 75,
                        notes: `Data from ${dataSource}`,
                        updated_at: new Date().toISOString()
                      }, {
                        onConflict: 'user_id,symbol,market_type,timeframe',
                        ignoreDuplicates: false
                      })

                    if (insertError) {
                      console.error(`Error saving data for ${symbol}:`, insertError)
                    }
                  }
                } catch (error) {
                  console.error(`Error processing ${symbol} ${marketType} ${timeframe}:`, error)
                }
              }
            }
          }
        }

        results.push({
          user_id: config.user_id,
          symbols_processed: symbols.length,
          status: 'completed'
        })
      } catch (error) {
        console.error(`Error processing user ${config.user_id}:`, error)
        results.push({
          user_id: config.user_id,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in mkt-data-scheduler:', error)
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
      { headers: { 'x-cg-pro-api-key': apiKey } }
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

function getTimeframeDays(timeframe: string, bars: number): number {
  const timeframeMap: { [key: string]: number } = {
    '1m': 1 / 1440,
    '5m': 5 / 1440,
    '15m': 15 / 1440,
    '1h': 1 / 24,
    '4h': 4 / 24,
    '1d': 1
  }
  const daysPerBar = timeframeMap[timeframe] || 1
  return Math.ceil(bars * daysPerBar)
}

function normalizeCoingeckoData(data: any, timeframe: string, bars: number): any[] {
  if (!data.prices || data.prices.length === 0) {
    return []
  }

  const timeframeMs = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000
  }[timeframe] || 3600000

  const ohlcv = []
  let currentCandle: any = null

  for (const [timestamp, price] of data.prices) {
    const candleTime = Math.floor(timestamp / timeframeMs) * timeframeMs

    if (!currentCandle || currentCandle.timestamp_ms !== candleTime) {
      if (currentCandle) {
        ohlcv.push(currentCandle)
      }
      currentCandle = {
        timestamp_ms: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0
      }
    }

    currentCandle.high = Math.max(currentCandle.high, price)
    currentCandle.low = Math.min(currentCandle.low, price)
    currentCandle.close = price
  }

  if (currentCandle) {
    ohlcv.push(currentCandle)
  }

  if (data.total_volumes) {
    for (let i = 0; i < Math.min(ohlcv.length, data.total_volumes.length); i++) {
      ohlcv[i].volume = data.total_volumes[i][1] || 0
    }
  }

  return ohlcv.slice(-bars)
}

function normalizeCoinMarketCapData(data: any, symbol: string): any[] {
  try {
    const quote = data?.data?.[symbol.toUpperCase()]?.quote?.USD
    if (!quote) return []

    const now = Date.now()
    return [{
      timestamp_ms: now,
      open: quote.price,
      high: quote.price,
      low: quote.price,
      close: quote.price,
      volume: quote.volume_24h || 0
    }]
  } catch (error) {
    console.error('Error normalizing CMC data:', error)
    return []
  }
}
