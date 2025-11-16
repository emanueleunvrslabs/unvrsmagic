import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Execution Logs | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
}

export default function ExecutionLogsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Execution Logs</CardTitle>
            <CardDescription>View your bot execution history</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Execution logs dashboard coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
