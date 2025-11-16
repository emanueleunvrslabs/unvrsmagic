import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Defi Protocols | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
}

export default function DeFiProtocolsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>DeFi Protocols</CardTitle>
            <CardDescription>Explore DeFi protocols and opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">DeFi protocols dashboard coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
