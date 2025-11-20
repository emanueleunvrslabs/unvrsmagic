import { useEffect } from "react"
import { useAgentAlerts } from "@/hooks/use-agent-alerts"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const alerts = useAgentAlerts()
  const { permission, showLocalNotification } = usePushNotifications()

  // Send browser notifications for new alerts
  useEffect(() => {
    if (!alerts.data || permission !== 'granted') {
      return
    }

    // Listen for new unread alerts
    const unreadAlerts = alerts.data.filter(alert => !alert.read)
    
    // Show notification for the most recent unread alert
    if (unreadAlerts.length > 0) {
      const latestAlert = unreadAlerts[0]
      const sessionKey = `notification-shown-${latestAlert.id}`
      
      // Check if we've already shown notification for this alert in this session
      if (!sessionStorage.getItem(sessionKey)) {
        showLocalNotification(latestAlert.title, {
          body: latestAlert.message,
          tag: latestAlert.id,
          requireInteraction: latestAlert.severity === 'critical',
          data: {
            url: '/notifications',
            alert_id: latestAlert.id,
          },
        })
        
        // Mark as shown in this session
        sessionStorage.setItem(sessionKey, 'true')
      }
    }
  }, [alerts.data, permission, showLocalNotification])

  return <>{children}</>
}
