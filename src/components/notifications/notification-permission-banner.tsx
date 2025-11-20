import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, X } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export const NotificationPermissionBanner = () => {
  const { permission, isSupported, requestPermission, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed or granted permission
    const hasDismissed = localStorage.getItem('notification-banner-dismissed')
    setDismissed(!!hasDismissed)
    setHasShown(true)
  }, [])

  const handleEnable = async () => {
    const granted = await requestPermission()
    if (granted) {
      await subscribe()
      handleDismiss()
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('notification-banner-dismissed', 'true')
  }

  // Don't show if not supported, already granted, denied, or dismissed
  if (!hasShown || !isSupported || permission === 'granted' || permission === 'denied' || dismissed) {
    return null
  }

  return (
    <Alert className="mb-6 border-primary/50 bg-primary/5">
      <Bell className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Enable Push Notifications</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3 text-sm">
          Stay informed about critical market alerts even when the app is closed. 
          Enable push notifications to receive real-time updates from NKMT agents.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleEnable}>
            <Bell className="mr-2 h-4 w-4" />
            Enable Notifications
          </Button>
          <Button size="sm" variant="outline" onClick={handleDismiss}>
            <BellOff className="mr-2 h-4 w-4" />
            Maybe Later
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
