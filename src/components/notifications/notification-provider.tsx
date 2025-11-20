import { useEffect } from "react"
import { useAgentAlerts } from "@/hooks/use-agent-alerts"

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize the alerts hook which will set up realtime subscriptions
  useAgentAlerts()

  return <>{children}</>
}
