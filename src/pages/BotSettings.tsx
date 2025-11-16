import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Bot Setting | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
}

export default function BotSettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Bot Settings</CardTitle>
          <CardDescription>Configure your trading bots</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bot settings dashboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
