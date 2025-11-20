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

    console.log('[RISK.MGR] Starting risk assessment cycle')

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
            agent_name: 'risk.mgr',
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
        console.error(`[RISK.MGR] No OpenAI API key for user ${userId}`)
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'risk.mgr',
            user_id: userId,
            log_level: 'error',
            message: 'OpenAI API key not configured',
            action: 'assess_risk'
          }
        })
        continue
      }

      // Receive signals and forecasts
      const { data: messagesResponse } = await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'receive',
          params: {
            receiver_agent: 'risk.mgr',
            user_id: userId
          }
        }
      })

      const messages = messagesResponse?.messages || []
      
      if (messages.length === 0) {
        console.log(`[RISK.MGR] No messages for user ${userId}`)
        continue
      }

      // Separate signals and forecasts
      const signals = messages.filter((m: any) => m.message_type === 'trading_signals')
      const forecasts = messages.filter((m: any) => m.message_type === 'market_forecast')

      if (signals.length === 0) {
        console.log(`[RISK.MGR] No trading signals to assess`)
        continue
      }

      const latestSignal = signals[0]?.payload
      const latestForecast = forecasts[0]?.payload

      const prompt = `You are an expert risk management analyst for cryptocurrency trading.

Trading Signals:
${JSON.stringify(latestSignal?.signals, null, 2)}

Market Forecast:
${latestForecast ? JSON.stringify(latestForecast.forecast, null, 2) : 'No forecast available'}

Current Market Conditions:
- Overall Sentiment: ${latestForecast?.overall_sentiment || 'Unknown'}
- Volatility Index: ${latestForecast?.volatility_index || 'Unknown'}

Assess the risk for each trading signal and provide:
1. Risk score (0-100, higher = riskier)
2. Position size recommendation (% of portfolio)
3. Risk factors identified
4. Risk mitigation strategies
5. Overall portfolio risk assessment

Respond in JSON format:
{
  "signal_assessments": [
    {
      "symbol": "BTCUSDT",
      "original_action": "LONG" | "SHORT",
      "risk_score": 0-100,
      "risk_level": "low" | "medium" | "high" | "extreme",
      "position_size_pct": 0-100,
      "risk_factors": ["factor1", "factor2"],
      "mitigation_strategies": ["strategy1", "strategy2"],
      "recommendation": "approve" | "reject" | "modify",
      "notes": "brief explanation"
    }
  ],
  "portfolio_risk": {
    "overall_risk_score": 0-100,
    "max_drawdown_estimate": 0-100,
    "diversification_score": 0-100,
    "recommendations": ["recommendation1", "recommendation2"]
  }
}

Consider:
- Stop loss and take profit levels
- Signal confidence levels
- Market volatility
- Portfolio concentration
- Maximum position size limits (never exceed 20% per position)

Respond ONLY with valid JSON.`

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
            { role: 'system', content: 'You are an expert risk management analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 2000
        }),
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        const error = await response.text()
        console.error('[RISK.MGR] OpenAI API error:', error)
        
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'risk.mgr',
            user_id: userId,
            log_level: 'error',
            message: `OpenAI API error: ${error}`,
            action: 'assess_risk',
            duration_ms: duration
          }
        })
        continue
      }

      const aiResponse = await response.json()
      const riskAssessmentText = aiResponse.choices[0].message.content

      // Parse risk assessment
      let riskAssessment
      try {
        riskAssessment = JSON.parse(riskAssessmentText)
      } catch (e) {
        console.error('[RISK.MGR] Failed to parse risk assessment:', e)
        await supabaseClient.functions.invoke('agent-logger', {
          body: {
            agent_name: 'risk.mgr',
            user_id: userId,
            log_level: 'error',
            message: 'Failed to parse AI response',
            action: 'assess_risk',
            duration_ms: duration,
            metadata: { raw_response: riskAssessmentText }
          }
        })
        continue
      }

      // Send approved signals to trade.executor
      const approvedSignals = riskAssessment.signal_assessments?.filter(
        (s: any) => s.recommendation === 'approve' || s.recommendation === 'modify'
      ) || []

      if (approvedSignals.length > 0) {
        await supabaseClient.functions.invoke('agent-message-broker', {
          body: {
            action: 'send',
            params: {
              sender_agent: 'risk.mgr',
              receiver_agent: 'trade.executor',
              message_type: 'approved_signals',
              payload: {
                signals: approvedSignals,
                portfolio_risk: riskAssessment.portfolio_risk,
                assessed_at: new Date().toISOString()
              },
              priority: 9,
              user_id: userId
            }
          }
        })
      }

      // Create alerts for high risk situations
      const highRiskSignals = riskAssessment.signal_assessments?.filter(
        (s: any) => s.risk_level === 'high' || s.risk_level === 'extreme'
      ) || []

      if (highRiskSignals.length > 0) {
        const alerts = highRiskSignals.map((s: any) => ({
          user_id: userId,
          agent_name: 'risk.mgr',
          alert_type: 'high_risk_signal',
          severity: s.risk_level === 'extreme' ? 'critical' : 'high',
          title: `High Risk Signal: ${s.symbol}`,
          message: `Signal for ${s.symbol} has ${s.risk_level} risk (score: ${s.risk_score}). Risk factors: ${s.risk_factors.join(', ')}`,
          metadata: s
        }))

        await supabaseClient
          .from('agent_alerts')
          .insert(alerts)
      }

      // Log successful risk assessment
      await supabaseClient.functions.invoke('agent-logger', {
        body: {
          agent_name: 'risk.mgr',
          user_id: userId,
          log_level: 'info',
          message: `Assessed ${riskAssessment.signal_assessments?.length || 0} signals, approved ${approvedSignals.length}`,
          action: 'assess_risk',
          duration_ms: duration,
          metadata: {
            total_signals: riskAssessment.signal_assessments?.length || 0,
            approved_signals: approvedSignals.length,
            high_risk_signals: highRiskSignals.length,
            overall_risk_score: riskAssessment.portfolio_risk?.overall_risk_score
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
            agent_name: 'risk.mgr',
            user_id: userId,
            status: 'idle',
            performance_metrics: {
              last_execution: new Date().toISOString(),
              signals_assessed: riskAssessment.signal_assessments?.length || 0,
              signals_approved: approvedSignals.length,
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
    console.error('[RISK.MGR] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
