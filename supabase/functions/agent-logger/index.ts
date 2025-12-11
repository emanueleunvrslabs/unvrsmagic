import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface LogEntry {
  agent_name: string
  user_id: string
  log_level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  metadata?: any
  action?: string
  duration_ms?: number
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

    if (action === 'log') {
      // Create a structured log entry
      const logEntry: LogEntry = params as LogEntry

      // Store in database for persistence
      const { error } = await supabaseClient
        .from('agent_logs')
        .insert([{
          agent_name: logEntry.agent_name,
          user_id: logEntry.user_id,
          log_level: logEntry.log_level,
          message: logEntry.message,
          metadata: logEntry.metadata || {},
          action: logEntry.action || null,
          duration_ms: logEntry.duration_ms || null,
          timestamp: new Date().toISOString()
        }])

      if (error) {
        console.error('[Agent Logger] Error storing log:', error)
      }

      // Also log to console for real-time monitoring
      const logPrefix = `[${logEntry.agent_name.toUpperCase()}][${logEntry.log_level.toUpperCase()}]`
      const logMessage = `${logPrefix} ${logEntry.message}`
      
      if (logEntry.metadata) {
        console.log(logMessage, logEntry.metadata)
      } else {
        console.log(logMessage)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'query') {
      // Query logs for a specific agent
      const { agent_name, user_id, limit = 100, log_level } = params

      let query = supabaseClient
        .from('agent_logs')
        .select('*')
        .eq('user_id', user_id)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (agent_name) {
        query = query.eq('agent_name', agent_name)
      }

      if (log_level) {
        query = query.eq('log_level', log_level)
      }

      const { data, error } = await query

      if (error) {
        console.error('[Agent Logger] Error querying logs:', error)
        throw error
      }

      return new Response(JSON.stringify({ success: true, logs: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    console.error('[Agent Logger] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})