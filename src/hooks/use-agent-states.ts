import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface AgentState {
  id: string
  agent_name: string
  user_id: string
  status: string
  last_execution: string | null
  last_error: string | null
  performance_metrics: any
  created_at: string
  updated_at: string
}

export const useAgentStates = () => {
  return useQuery({
    queryKey: ['agent-states'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('agent_state')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as AgentState[]
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })
}