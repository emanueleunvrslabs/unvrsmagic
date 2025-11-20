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
  const startTime = Date.now()
  console.log('🚀 [MKT.DATA Scheduler] Started at', new Date().toISOString())
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log function to persist logs
    const logToDatabase = async (userId: string, level: string, message: string, metadata?: any) => {
      try {
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            action: 'log',
            agent_name: 'mkt.data',
            user_id: userId,
            log_level: level,
            message,
            metadata: metadata || {}
          }
        })
      } catch (logError) {
        console.error('❌ [MKT.DATA] Failed to persist log:', logError)
      }
    }

    // Fetch all users with enabled mkt_data_config
    const { data: configs, error: configError } = await supabaseClient
      .from('mkt_data_config')
      .select('*')
      .eq('enabled', true)

    if (configError) {
      console.error('❌ [MKT.DATA] Error fetching configs:', configError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch configurations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 [MKT.DATA] Processing ${configs?.length || 0} user configurations`)

    const results = []

    // Process each user configuration
    for (const config of configs || []) {
      const userStartTime = Date.now()
      
      try {
        await logToDatabase(config.user_id, 'info', `Starting data collection for user`, {
          symbols_count: TOP_100_SYMBOLS.length,
          timeframes: config.timeframes,
          market_types: config.market_types
        })

        // Update agent state to processing
        await supabaseClient.functions.invoke('agent-message-broker', {
          body: {
            action: 'update_agent_state',
            agent_name: 'mkt.data',
            user_id: config.user_id,
            status: 'processing'
          }
        })
        // Fetch user's API keys
        const { data: apiKeys } = await supabaseClient
          .from('api_keys')
          .select('provider, api_key')
          .eq('user_id', config.user_id)
          .in('provider', ['coingecko', 'coinmarketcap'])

        if (!apiKeys || apiKeys.length === 0) {
          await logToDatabase(config.user_id, 'warning', 'No API keys found, skipping data collection')
          console.log(`⚠️ [MKT.DATA] No API keys found for user ${config.user_id}, skipping`)
          continue
        }

        const coinGeckoKey = apiKeys.find(k => k.provider === 'coingecko')?.api_key
        const coinMarketCapKey = apiKeys.find(k => k.provider === 'coinmarketcap')?.api_key

        await logToDatabase(config.user_id, 'info', 'API keys retrieved', {
          has_coingecko: !!coinGeckoKey,
          has_coinmarketcap: !!coinMarketCapKey
        })

        // Use TOP 100 symbols
        const symbols = TOP_100_SYMBOLS
        const timeframes = config.timeframes || ['1h', '4h', '1d']
        const marketTypes = config.market_types || ['spot', 'futures']
        const lookbackBars = config.lookback_bars || 100

        console.log(`📊 [MKT.DATA] Processing user ${config.user_id} with ${symbols.length} symbols`)
        
        let successCount = 0
        let errorCount = 0

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
                        `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
                        { headers: { 'x-cg-pro-api-key': coinGeckoKey } }
                      )
                      
                      if (response.ok) {
                        const data = await response.json()
                        ohlcvData = normalizeCoingeckoOHLCData(data, lookbackBars)
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
                      errorCount++
                      console.error(`❌ [MKT.DATA] Error saving data for ${symbol}:`, insertError)
                    } else {
                      successCount++
                    }
                  }
                } catch (error) {
                  errorCount++
                  console.error(`❌ [MKT.DATA] Error processing ${symbol} ${marketType} ${timeframe}:`, error)
                }
              }
            }
          }
        }

        const userDuration = Date.now() - userStartTime
        
        await logToDatabase(config.user_id, 'info', 'Data collection completed', {
          success_count: successCount,
          error_count: errorCount,
          duration_ms: userDuration,
          symbols_processed: symbols.length
        })

        results.push({
          user_id: config.user_id,
          symbols_processed: symbols.length,
          success_count: successCount,
          error_count: errorCount,
          status: 'completed'
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        await logToDatabase(config.user_id, 'error', 'Data collection failed', {
          error: errorMessage
        })
        
        console.error(`❌ [MKT.DATA] Error processing user ${config.user_id}:`, error)
        results.push({
          user_id: config.user_id,
          status: 'error',
          error: errorMessage
        })
      }
    }

    console.log('📨 [MKT.DATA Scheduler] Sending data to NKMT orchestrator')

    // For each user, fetch their collected data and send messages to NKMT
    for (const config of configs || []) {
      try {
        const { data: collectedData } = await supabaseClient
          .from('mkt_data_results')
          .select('*')
          .eq('user_id', config.user_id)
          .order('updated_at', { ascending: false })
          .limit(100)

        if (collectedData && collectedData.length > 0) {
          // Group by symbol for aggregation
          const symbolGroups = collectedData.reduce((acc: any, item: any) => {
            const key = `${item.symbol}_${item.market_type}_${item.timeframe}`
            if (!acc[key]) acc[key] = []
            acc[key].push(item)
            return acc
          }, {})

          // Send messages for each symbol/timeframe/market combination
          for (const [key, items] of Object.entries(symbolGroups)) {
            const latestItem = (items as any[])[0]
            const ohlcv = latestItem.ohlcv || []
            const latestCandle = ohlcv[ohlcv.length - 1]

            await supabaseClient.functions.invoke('agent-message-broker', {
              body: {
                action: 'send',
                sender_agent: 'mkt.data',
                receiver_agent: 'nkmt',
                message_type: 'market_data_update',
                payload: {
                  symbol: latestItem.symbol,
                  timeframe: latestItem.timeframe,
                  market_type: latestItem.market_type,
                  latest_price: latestCandle?.close || 0,
                  volume_24h: latestCandle?.volume || 0,
                  data_points: ohlcv.length,
                  data_sources: latestItem.data_sources || [],
                  confidence_score: latestItem.confidence_score || 0,
                  timestamp: new Date().toISOString()
                },
                priority: 7,
                user_id: config.user_id
              }
            })

            console.log(`📤 [MKT.DATA] Sent message for ${latestItem.symbol} ${latestItem.timeframe} ${latestItem.market_type}`)
          }

          // Update agent state
          await supabaseClient.functions.invoke('agent-message-broker', {
            body: {
              action: 'update_agent_state',
              agent_name: 'mkt.data',
              user_id: config.user_id,
              status: 'idle',
              performance_metrics: {
                last_collection_at: new Date().toISOString(),
                total_data_points: collectedData.length,
                unique_symbols: Object.keys(symbolGroups).length,
                data_sources_used: [...new Set(collectedData.flatMap((d: any) => d.data_sources || []))]
              }
            }
          })

          console.log(`✅ [MKT.DATA] Updated agent state for user ${config.user_id}`)
        }
      } catch (msgError) {
        console.error(`❌ [MKT.DATA] Error sending messages for user ${config.user_id}:`, msgError)
      }
    }

    console.log('✅ [MKT.DATA Scheduler] Completed all operations')

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

function normalizeCoingeckoOHLCData(data: any, bars: number): any[] {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return []
  }

  // CoinGecko OHLC format: [timestamp, open, high, low, close]
  const ohlcv = data.map(([timestamp, open, high, low, close]: number[]) => ({
    timestamp_ms: timestamp,
    open,
    high,
    low,
    close,
    volume: 0 // OHLC endpoint doesn't provide volume
  }))

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
