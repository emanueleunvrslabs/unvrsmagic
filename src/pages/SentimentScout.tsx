import "@/components/labs/SocialMediaCard.css"
import { DashboardLayout } from "@/components/dashboard-layout"

const SentimentScout = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="labs-client-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">SENTIMENT.SCOUT Agent</h2>
          <p className="text-muted-foreground">
            Social media and news sentiment analysis for market intelligence. Coming soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SentimentScout
