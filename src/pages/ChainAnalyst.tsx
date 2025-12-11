import "@/components/labs/SocialMediaCard.css"
import { DashboardLayout } from "@/components/dashboard-layout"

const ChainAnalyst = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="labs-client-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">CHAIN.ANALYST Agent</h2>
          <p className="text-muted-foreground">
            On-chain data analysis and blockchain intelligence. Coming soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ChainAnalyst
