import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[MARKET.MODELER] Starting market modeling cycle')

    // Get all users with active configs
    const { data: configs, error: configError } = await supabaseClient
      .from('mkt_data_config')
      .select('user_id')
      .eq('enabled', true)

    if (configError) throw configError

    for (const config of configs || []) {
      const userId = config.user_id

      // Update agent state
      await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'update_agent_state',
          params: {
            agent_name: 'market.modeler',
            user_id: userId,
            status: 'processing'
          }
        }
      })

      // Get Anthropic API key
      const { data: apiKeys } = await supabaseClient
        .from('api_keys')
        .select('api_key')
        .eq('user_id', userId)
        .eq('provider', 'anthropic')
        .single()

      if (!apiKeys?.api_key) {
        console.error(`[MARKET.MODELER] No Anthropic API key for user ${userId}`)
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'market.modeler',
            user_id: userId,
            log_level: 'error',
            message: 'Anthropic API key not configured',
            action: 'generate_forecast'
          }
        })
        continue
      }

      // Receive market data from NKMT
      const { data: messagesResponse } = await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'receive',
          params: {
            receiver_agent: 'market.modeler',
            user_id: userId
          }
        }
      })

      const messages = messagesResponse?.messages || []
      
      if (messages.length === 0) {
        console.log(`[MARKET.MODELER] No messages for user ${userId}`)
        continue
      }

      // Get latest market data
      const latestData = messages[0]?.payload

      if (!latestData || !latestData.symbols) {
        console.log(`[MARKET.MODELER] No market data in messages`)
        continue
      }

      // Get historical OHLCV data from database for pattern detection
      const { data: historicalData } = await supabaseClient
        .from('mkt_data_results')
        .select('symbol, timeframe, ohlcv, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      const marketSummary = latestData.symbols.map((s: any) => 
        `${s.symbol}: Price ${s.price}, Volume ${s.volume}, Confidence ${s.confidence_score}%`
      ).join('\n')

      const prompt = `You are an expert quantitative analyst specializing in crypto market forecasting and pattern detection.

Current Market Data:
${marketSummary}

Historical Data Points: ${historicalData?.length || 0} recent records
Total Data Points: ${latestData.total_data_points}
Data Sources: ${Array.from(latestData.sources || []).join(', ')}

Analyze this data and provide:
1. Short-term forecast (1-4 hours)
2. Pattern detection (head & shoulders, double top/bottom, triangles, etc.)
3. Key support and resistance levels
4. Market sentiment analysis
5. Volatility assessment

Respond in JSON format:
{
  "forecasts": [
    {
      "symbol": "BTCUSDT",
      "timeframe": "1h-4h",
      "direction": "bullish" | "bearish" | "neutral",
      "confidence": 0-100,
      "target_price": number,
      "probability": 0-100
    }
  ],
  "patterns": [
    {
      "symbol": "BTCUSDT",
      "pattern_type": "string",
      "reliability": 0-100,
      "implications": "brief explanation"
    }
  ],
  "support_resistance": {
    "symbol": {
      "support": [price1, price2],
      "resistance": [price1, price2]
    }
  },
  "overall_sentiment": "bullish" | "bearish" | "neutral",
  "volatility_index": 0-100
}

Respond ONLY with valid JSON.`

      const startTime = Date.now()
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKeys.api_key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4000,
          messages: [
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          system: 'You are an expert quantitative analyst specializing in crypto market forecasting. Always respond with valid JSON only.'
        }),
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        const error = await response.text()
        console.error('[MARKET.MODELER] Anthropic API error:', error)
        
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'market.modeler',
            user_id: userId,
            log_level: 'error',
            message: `Anthropic API error: ${error}`,
            action: 'generate_forecast',
            duration_ms: duration
          }
        })
        continue
      }

      const aiResponse = await response.json()
      const forecastText = aiResponse.content[0].text

      // Parse forecast
      let forecast
      try {
        forecast = JSON.parse(forecastText)
      } catch (e) {
        console.error('[MARKET.MODELER] Failed to parse forecast:', e)
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'market.modeler',
            user_id: userId,
            log_level: 'error',
            message: 'Failed to parse AI response',
            action: 'generate_forecast',
            duration_ms: duration,
            metadata: { raw_response: forecastText }
          }
        })
        continue
      }

      // Send forecast to signal.maker and risk.mgr
      const recipients = ['signal.maker', 'risk.mgr']
      
      for (const recipient of recipients) {
        await supabaseClient.functions.invoke('agent-message-broker', {
          body: {
            action: 'send',
            params: {
              sender_agent: 'market.modeler',
              receiver_agent: recipient,
              message_type: 'market_forecast',
              payload: {
                forecast,
                generated_at: new Date().toISOString(),
                market_data_timestamp: latestData.timestamp
              },
              priority: 7,
              user_id: userId
            }
          }
        })
      }

      // Log successful forecast generation
      await supabaseClient.functions.invoke('agent-logger', {
        body: {
          agent_name: 'market.modeler',
          user_id: userId,
          log_level: 'info',
          message: `Generated forecast for ${forecast.forecasts?.length || 0} symbols`,
          action: 'generate_forecast',
          duration_ms: duration,
          metadata: {
            forecasts_count: forecast.forecasts?.length || 0,
            patterns_detected: forecast.patterns?.length || 0,
            overall_sentiment: forecast.overall_sentiment
          }
        }
      })

      // Mark messages as processed
      const messageIds = messages.map((m: any) => m.id)
      await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'mark_processed',
          params: {
            message_ids: messageIds
          }
        }
      })

      // Update agent state
      await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'update_agent_state',
          params: {
            agent_name: 'market.modeler',
            user_id: userId,
            status: 'idle',
            performance_metrics: {
              last_execution: new Date().toISOString(),
              forecasts_generated: forecast.forecasts?.length || 0,
              processing_time_ms: duration
            }
          }
        }
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MARKET.MODELER] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
