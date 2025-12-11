import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export interface AgentAlertMetadata {
  [key: string]: unknown
}

export interface AgentAlert {
  id: string
  user_id: string
  agent_name: string
  alert_type: string
  severity: string
  title: string
  message: string
  metadata: AgentAlertMetadata | null
  read: boolean
  created_at: string
}

export const useAgentAlerts = () => {
  const queryClient = useQueryClient()
  const [hasShownToast, setHasShownToast] = useState<Set<string>>(new Set())

  const query = useQuery({
    queryKey: ['agent-alerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('agent_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as AgentAlert[]
    },
    refetchInterval: 10000,
  })

  // Set up realtime subscription for new alerts
  useEffect(() => {
    const channel = supabase
      .channel('agent-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_alerts'
        },
        (payload) => {
          const newAlert = payload.new as AgentAlert
          
          // Show toast notification for new alert if not already shown
          if (!hasShownToast.has(newAlert.id)) {
            const isHighPriority = newAlert.severity === 'critical' || newAlert.severity === 'high'
            
            toast[isHighPriority ? 'error' : 'warning'](newAlert.title, {
              description: newAlert.message,
              duration: isHighPriority ? 10000 : 5000,
            })
            
            setHasShownToast(prev => new Set([...prev, newAlert.id]))
          }
          
          // Invalidate and refetch alerts
          queryClient.invalidateQueries({ queryKey: ['agent-alerts'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, hasShownToast])

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('agent_alerts')
      .update({ read: true })
      .eq('id', alertId)

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['agent-alerts'] })
    }
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('agent_alerts')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['agent-alerts'] })
    }
  }

  return {
    ...query,
    markAsRead,
    markAllAsRead,
    unreadCount: query.data?.filter(alert => !alert.read).length || 0
  }
}
