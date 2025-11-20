import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentMessage {
  id: string
  sender_agent: string
  receiver_agent: string
  message_type: string
  payload: any
  priority: number
  created_at: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[NKMT Orchestrator] Starting orchestration cycle')

    // Get all users with active mkt_data_config
    const { data: configs, error: configError } = await supabaseClient
      .from('mkt_data_config')
      .select('user_id')
      .eq('enabled', true)

    if (configError) {
      console.error('[NKMT Orchestrator] Error fetching configs:', configError)
      throw configError
    }

    console.log(`[NKMT Orchestrator] Processing ${configs?.length || 0} active users`)

    for (const config of configs || []) {
      const userId = config.user_id

      // Update NKMT state
      await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'update_agent_state',
          agent_name: 'nkmt',
          user_id: userId,
          status: 'processing',
          performance_metrics: {
            cycle_started_at: new Date().toISOString()
          }
        }
      })

      // Receive pending messages from all agents
      const { data: messagesResponse } = await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'receive',
          receiver_agent: 'nkmt',
          user_id: userId
        }
      })

      const messages: AgentMessage[] = messagesResponse?.messages || []
      console.log(`[NKMT Orchestrator] Received ${messages.length} messages for user ${userId}`)

      if (messages.length === 0) {
        console.log(`[NKMT Orchestrator] No messages to process for user ${userId}`)
        continue
      }

      // Process messages by type
      const marketDataMessages = messages.filter(m => m.message_type === 'market_data_update')
      
      console.log(`[NKMT Orchestrator] Processing ${marketDataMessages.length} market data updates`)

      // Aggregate market data
      const aggregatedData = {
        symbols: [] as any[],
        total_data_points: 0,
        sources: new Set<string>(),
        timestamp: new Date().toISOString()
      }

      for (const msg of marketDataMessages) {
        const payload = msg.payload
        aggregatedData.symbols.push({
          symbol: payload.symbol,
          timeframe: payload.timeframe,
          market_type: payload.market_type,
          price: payload.latest_price,
          volume: payload.volume_24h,
          confidence_score: payload.confidence_score
        })
        aggregatedData.total_data_points += payload.data_points || 0
        if (payload.data_sources) {
          payload.data_sources.forEach((s: string) => aggregatedData.sources.add(s))
        }
      }

      console.log(`[NKMT Orchestrator] Aggregated data:`, {
        symbols_count: aggregatedData.symbols.length,
        data_points: aggregatedData.total_data_points,
        sources: Array.from(aggregatedData.sources)
      })

      // Send aggregated data to other agents (SIGNAL.MAKER, RISK.MGR, etc.)
      const agentsToNotify = ['signal.maker', 'risk.mgr', 'market.modeler']
      
      for (const agent of agentsToNotify) {
        await supabaseClient.functions.invoke('agent-message-broker', {
          body: {
            action: 'send',
            sender_agent: 'nkmt',
            receiver_agent: agent,
            message_type: 'aggregated_market_data',
            payload: {
              ...aggregatedData,
              sources: Array.from(aggregatedData.sources)
            },
            priority: 8,
            user_id: userId
          }
        })

        console.log(`[NKMT Orchestrator] Sent aggregated data to ${agent}`)
      }

      // Mark processed messages
      const messageIds = messages.map(m => m.id)
      await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'mark_processed',
          message_ids: messageIds
        }
      })

      // Update NKMT state to idle
      await supabaseClient.functions.invoke('agent-message-broker', {
        body: {
          action: 'update_agent_state',
          agent_name: 'nkmt',
          user_id: userId,
          status: 'idle',
          performance_metrics: {
            last_cycle_completed_at: new Date().toISOString(),
            messages_processed: messages.length,
            symbols_processed: aggregatedData.symbols.length
          }
        }
      })

      console.log(`[NKMT Orchestrator] Completed orchestration for user ${userId}`)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Orchestration cycle completed',
      users_processed: configs?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[NKMT Orchestrator] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})