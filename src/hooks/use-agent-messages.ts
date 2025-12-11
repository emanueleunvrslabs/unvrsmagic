import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import type { AgentMessagePayload } from "@/types/content"

export interface AgentMessage {
  id: string
  sender_agent: string
  receiver_agent: string
  message_type: string
  payload: AgentMessagePayload
  priority: number
  status: string
  created_at: string
  processed_at: string | null
  user_id: string
}

export const useAgentMessages = () => {
  return useQuery({
    queryKey: ['agent-messages'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as AgentMessage[]
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  })
}