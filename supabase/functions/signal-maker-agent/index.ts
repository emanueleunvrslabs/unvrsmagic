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

    console.log('[SIGNAL.MAKER] Starting signal generation cycle')

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
            agent_name: 'signal.maker',
            user_id: userId,
            status: 'processing'
          }
        }
      })

      // Get OpenAI API key
      const { data: apiKeys } = await supabaseClient
        .from('api_keys')
        .select('api_key')
        .eq('user_id', userId)
        .eq('provider', 'openai')
        .single()

      if (!apiKeys?.api_key) {
        console.error(`[SIGNAL.MAKER] No OpenAI API key for user ${userId}`)
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'signal.maker',
            user_id: userId,
            log_level: 'error',
            message: 'OpenAI API key not configured',
            action: 'generate_signals'
          }
        })
        continue
      }

      // Receive market data from NKMT
      const { data: messagesResponse } = await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'receive',
          params: {
            receiver_agent: 'signal.maker',
            user_id: userId
          }
        }
      })

      const messages = messagesResponse?.messages || []
      
      if (messages.length === 0) {
        console.log(`[SIGNAL.MAKER] No messages for user ${userId}`)
        continue
      }

      // Get latest market data
      const latestData = messages[0]?.payload

      if (!latestData || !latestData.symbols) {
        console.log(`[SIGNAL.MAKER] No market data in messages`)
        continue
      }

      // Prepare market analysis prompt
      const marketSummary = latestData.symbols.map((s: any) => 
        `${s.symbol}: Price ${s.price}, Volume ${s.volume}, Confidence ${s.confidence_score}%`
      ).join('\n')

      const prompt = `You are an expert crypto trading signal generator. Analyze this market data and generate trading signals.

Market Data:
${marketSummary}

Total Data Points: ${latestData.total_data_points}
Data Sources: ${Array.from(latestData.sources || []).join(', ')}
Timestamp: ${latestData.timestamp}

Generate trading signals in JSON format with this structure:
{
  "signals": [
    {
      "symbol": "BTCUSDT",
      "action": "LONG" or "SHORT" or "NEUTRAL",
      "confidence": 0-100,
      "entry_price": number,
      "stop_loss": number,
      "take_profit": number,
      "reasoning": "brief explanation"
    }
  ]
}

Only generate signals with confidence > 70%. Consider:
1. Price trends and momentum
2. Volume patterns
3. Data confidence scores
4. Risk/reward ratios

Respond ONLY with valid JSON.`

      // Call OpenAI API with o3 model (GPT-5.1 Thinking equivalent)
      const startTime = Date.now()
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'o3-2025-04-16',
          messages: [
            { role: 'system', content: 'You are an expert crypto trading signal generator. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 2000
        }),
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        const error = await response.text()
        console.error('[SIGNAL.MAKER] OpenAI API error:', error)
        
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'signal.maker',
            user_id: userId,
            log_level: 'error',
            message: `OpenAI API error: ${error}`,
            action: 'generate_signals',
            duration_ms: duration
          }
        })
        continue
      }

      const aiResponse = await response.json()
      const signalsText = aiResponse.choices[0].message.content

      // Parse signals
      let signals
      try {
        signals = JSON.parse(signalsText)
      } catch (e) {
        console.error('[SIGNAL.MAKER] Failed to parse signals:', e)
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'signal.maker',
            user_id: userId,
            log_level: 'error',
            message: 'Failed to parse AI response',
            action: 'generate_signals',
            duration_ms: duration,
            metadata: { raw_response: signalsText }
          }
        })
        continue
      }

      // Send signals to risk.mgr and trade.executor
      const recipients = ['risk.mgr', 'trade.executor']
      
      for (const recipient of recipients) {
        await supabaseClient.functions.invoke('agent-message-broker', {
          body: {
            action: 'send',
            params: {
              sender_agent: 'signal.maker',
              receiver_agent: recipient,
              message_type: 'trading_signals',
              payload: {
                signals: signals.signals,
                generated_at: new Date().toISOString(),
                market_data_timestamp: latestData.timestamp
              },
              priority: 8,
              user_id: userId
            }
          }
        })
      }

      // Log successful signal generation
      await supabaseClient.functions.invoke('agent-logger', {
        body: {
          agent_name: 'signal.maker',
          user_id: userId,
          log_level: 'info',
          message: `Generated ${signals.signals?.length || 0} trading signals`,
          action: 'generate_signals',
          duration_ms: duration,
          metadata: {
            signals_count: signals.signals?.length || 0,
            high_confidence_signals: signals.signals?.filter((s: any) => s.confidence > 80).length || 0
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
            agent_name: 'signal.maker',
            user_id: userId,
            status: 'idle',
            performance_metrics: {
              last_execution: new Date().toISOString(),
              signals_generated: signals.signals?.length || 0,
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
    console.error('[SIGNAL.MAKER] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
