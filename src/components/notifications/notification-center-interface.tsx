import { useState } from "react"
import { useAgentAlerts } from "@/hooks/use-agent-alerts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, BellOff, Check, CheckCheck, AlertCircle, AlertTriangle, Info, Activity } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"

export const NotificationCenterInterface = () => {
  const { data: alerts, isLoading, markAsRead, markAllAsRead, unreadCount } = useAgentAlerts()
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredAlerts = alerts?.filter(alert => {
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter
    const matchesType = typeFilter === "all" || alert.alert_type === typeFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "read" && alert.read) || 
      (statusFilter === "unread" && !alert.read)
    
    return matchesSeverity && matchesType && matchesStatus
  }) || []

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
      case 'low':
        return <Info className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_anomaly':
        return <Activity className="h-5 w-5 text-primary" />
      case 'volume_spike':
        return <Activity className="h-5 w-5 text-accent" />
      case 'critical_signal':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Center</h1>
          <p className="text-muted-foreground mt-2">
            Manage and review all your NKMT agent alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Bell className="h-4 w-4 mr-2" />
            {unreadCount} Unread
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {alerts?.filter(a => a.severity === 'critical').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {alerts?.filter(a => a.severity === 'high').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Filter and manage your notifications</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="price_anomaly">Price Anomaly</SelectItem>
                <SelectItem value="volume_spike">Volume Spike</SelectItem>
                <SelectItem value="critical_signal">Critical Signal</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <BellOff className="h-12 w-12 mb-4" />
                <p>No alerts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`transition-all hover:shadow-md ${
                      !alert.read ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getTypeIcon(alert.alert_type)}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{alert.title}</h4>
                                {!alert.read && (
                                  <Badge variant="default" className="text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {alert.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {getSeverityIcon(alert.severity)}
                                <span className="ml-1 capitalize">{alert.severity}</span>
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="capitalize">{alert.agent_name}</span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(alert.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                              {alert.metadata?.symbol && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {alert.metadata.symbol}
                                  </Badge>
                                </>
                              )}
                            </div>

                            {!alert.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(alert.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark as Read
                              </Button>
                            )}
                          </div>

                          {alert.metadata && Object.keys(alert.metadata).length > 1 && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                              <pre className="overflow-x-auto">
                                {JSON.stringify(alert.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
