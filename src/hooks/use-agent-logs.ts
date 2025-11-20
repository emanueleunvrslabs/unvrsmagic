import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface AgentLog {
  id: string
  agent_name: string
  user_id: string
  log_level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  metadata: any
  action: string | null
  duration_ms: number | null
  timestamp: string
  created_at: string
}

export const useAgentLogs = (agentName?: string, logLevel?: string) => {
  return useQuery({
    queryKey: ['agent-logs', agentName, logLevel],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('agent_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (agentName) {
        query = query.eq('agent_name', agentName)
      }

      if (logLevel) {
        query = query.eq('log_level', logLevel)
      }

      const { data, error } = await query

      if (error) throw error
      return data as AgentLog[]
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })
}