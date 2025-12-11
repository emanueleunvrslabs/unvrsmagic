import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AgentMessage {
  sender_agent: string
  receiver_agent: string
  message_type: string
  payload: any
  priority?: number
  user_id: string
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

    const { action, ...params } = await req.json()

    console.log(`[Agent Message Broker] Action: ${action}`, params)

    if (action === 'send') {
      // Send a message from one agent to another
      const message: AgentMessage = params as AgentMessage

      const { data, error } = await supabaseClient
        .from('agent_messages')
        .insert([message])
        .select()
        .single()

      if (error) {
        console.error('[Agent Message Broker] Error sending message:', error)
        throw error
      }

      console.log(`[Agent Message Broker] Message sent: ${message.sender_agent} -> ${message.receiver_agent}`)

      return new Response(JSON.stringify({ success: true, message: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'receive') {
      // Get pending messages for a specific agent
      const { receiver_agent, user_id } = params

      const { data, error } = await supabaseClient
        .from('agent_messages')
        .select('*')
        .eq('receiver_agent', receiver_agent)
        .eq('user_id', user_id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[Agent Message Broker] Error receiving messages:', error)
        throw error
      }

      console.log(`[Agent Message Broker] Retrieved ${data?.length || 0} messages for ${receiver_agent}`)

      return new Response(JSON.stringify({ success: true, messages: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'mark_processed') {
      // Mark messages as processed
      const { message_ids } = params

      const { error } = await supabaseClient
        .from('agent_messages')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .in('id', message_ids)

      if (error) {
        console.error('[Agent Message Broker] Error marking messages as processed:', error)
        throw error
      }

      console.log(`[Agent Message Broker] Marked ${message_ids.length} messages as processed`)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update_agent_state') {
      // Update agent state
      const { agent_name, user_id, status, last_error, performance_metrics } = params

      const { data, error } = await supabaseClient
        .from('agent_state')
        .upsert({
          agent_name,
          user_id,
          status,
          last_execution: new Date().toISOString(),
          last_error: last_error || null,
          performance_metrics: performance_metrics || null,
        }, {
          onConflict: 'agent_name,user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('[Agent Message Broker] Error updating agent state:', error)
        throw error
      }

      console.log(`[Agent Message Broker] Updated state for ${agent_name}: ${status}`)

      return new Response(JSON.stringify({ success: true, state: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    console.error('[Agent Message Broker] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})