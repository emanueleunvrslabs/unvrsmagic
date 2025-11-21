import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Top crypto symbols verified on Bitget
const TOP_100_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT',
  'AVAXUSDT', 'LINKUSDT', 'DOTUSDT', 'MATICUSDT', 'SHIBUSDT', 'LTCUSDT', 'BCHUSDT', 'UNIUSDT',
  'ATOMUSDT', 'ETCUSDT', 'XLMUSDT', 'APTUSDT', 'FILUSDT', 'NEARUSDT', 'VETUSDT', 'ALGOUSDT',
  'ICPUSDT', 'HBARUSDT', 'AAVEUSDT', 'GRTUSDT', 'IMXUSDT', 'SANDUSDT', 'INJUSDT',
  'MANAUSDT', 'RNDRUSDT', 'MKRUSDT', 'LDOUSDT', 'FTMUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT',
  'PEPEUSDT', 'RUNEUSDT', 'FLOWUSDT', 'AXSUSDT', 'TIAUSDT', 'STXUSDT',
  'FLOKIUSDT', 'WLDUSDT', 'SEIUSDT', 'CRVUSDT', 'SNXUSDT', 'GALAUSDT', 'CHZUSDT',
  'ENJUSDT', 'COMPUSDT', 'JUPUSDT', 'MINAUSDT', 'ZECUSDT', 'DASHUSDT',
  'XTZUSDT', 'KAVAUSDT', 'BANDUSDT', 'YFIUSDT', '1INCHUSDT', 'SUSHIUSDT', 'DYDXUSDT', 'ENSUSDT',
  'TAOUSDT', 'TONUSDT', 'WIFUSDT', 'BONKUSDT', 'BOMEUSDT', 'ENAUSDT', 'RENDERUSDT', 'THETAUSDT',
  'GMTUSDT', 'JASMYUSDT', 'FETUSDT', 'ARUSDT', 'PENDLEUSDT', 'ROSEUSDT', 'BELUSDT', 'APEUSDT',
  'LDOUSDT', 'AGIXUSDT', 'MASKUSDT', 'LQTYUSDT', 'MAVIAUSDT', 'RADUSDT', 'GMXUSDT', 'BLZUSDT',
  'OCEANUSDT', 'CELOUSDT', 'SKLUSDT', 'ANKRUSDT', 'SFPUSDT', 'SFUND USDT'
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

        // Use TOP 100 symbols
        const symbols = TOP_100_SYMBOLS
        const timeframes = config.timeframes || ['1h', '4h', '1d']
        const marketTypes = config.market_types || ['spot', 'futures']
        const lookbackBars = config.lookback_bars || 500

        console.log(`📊 [MKT.DATA] Processing user ${config.user_id} with ${symbols.length} symbols`)
        
        // Get user's auth token by creating a temporary client
        const { data: { user: adminUser }, error: userError } = await supabaseClient.auth.admin.getUserById(config.user_id)
        
        if (userError || !adminUser) {
          console.error(`❌ [MKT.DATA] Cannot get user ${config.user_id}:`, userError)
          await logToDatabase(config.user_id, 'error', 'Failed to get user authentication')
          continue
        }

        // Call the mkt-data-agent with batches of symbols
        const batchSize = 20 // Process 20 symbols at a time
        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < symbols.length; i += batchSize) {
          const batchSymbols = symbols.slice(i, i + batchSize)
          
          console.log(`📦 [MKT.DATA] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)} for user ${config.user_id}`)
          
          try {
            // Create a service role client to act as the user
            const userSupabaseClient = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Call mkt-data-agent
            const { data: agentResponse, error: agentError } = await userSupabaseClient.functions.invoke('mkt-data-agent', {
              body: {
                symbols: batchSymbols,
                timeframes,
                lookback_bars: lookbackBars,
                market_types: marketTypes
              },
              headers: {
                // Set authorization as the user
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              }
            })

            if (agentError) {
              console.error(`❌ [MKT.DATA] Agent error for batch ${i}-${i + batchSize}:`, agentError)
              errorCount += batchSymbols.length
              continue
            }

            if (agentResponse?.success) {
              successCount += agentResponse.symbols?.length || 0
              errorCount += agentResponse.errors?.length || 0
              
              console.log(`✅ [MKT.DATA] Batch processed: ${agentResponse.symbols?.length || 0} success, ${agentResponse.errors?.length || 0} errors`)
            }

          } catch (batchError) {
            console.error(`❌ [MKT.DATA] Error processing batch:`, batchError)
            errorCount += batchSymbols.length
          }

          // Add a small delay between batches to avoid rate limiting
          if (i + batchSize < symbols.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

        const userDuration = Date.now() - userStartTime
        
        await logToDatabase(config.user_id, 'info', 'Data collection completed', {
          success_count: successCount,
          error_count: errorCount,
          duration_ms: userDuration,
          symbols_processed: symbols.length
        })

        console.log(`✅ [MKT.DATA] User ${config.user_id} completed: ${successCount} success, ${errorCount} errors in ${userDuration}ms`)

        results.push({
          user_id: config.user_id,
          symbols_processed: symbols.length,
          success_count: successCount,
          error_count: errorCount,
          status: 'completed',
          duration_ms: userDuration
        })

        // Send messages to NKMT orchestrator with collected data
        console.log('📨 [MKT.DATA] Sending data to NKMT orchestrator')

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
                  data_sources: latestItem.data_sources || ['bitget'],
                  confidence_score: latestItem.confidence_score || 95,
                  timestamp: new Date().toISOString()
                },
                priority: 7,
                user_id: config.user_id
              }
            })

            console.log(`📤 [MKT.DATA] Sent message for ${latestItem.symbol} ${latestItem.timeframe} ${latestItem.market_type}`)
          }

          // Update agent state to idle
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
                data_sources_used: ['bitget']
              }
            }
          })
        }

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

    const totalDuration = Date.now() - startTime
    console.log(`✅ [MKT.DATA Scheduler] Completed in ${totalDuration}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        total_duration_ms: totalDuration,
        scheduler_info: {
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [MKT.DATA Scheduler] Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
