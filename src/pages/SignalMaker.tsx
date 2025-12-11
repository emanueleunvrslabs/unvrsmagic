import "@/components/labs/SocialMediaCard.css"
import { DashboardLayout } from "@/components/dashboard-layout"

const SignalMaker = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="labs-client-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">SIGNAL.MAKER Agent</h2>
          <p className="text-muted-foreground">
            Trading signal generation and opportunity identification. Coming soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SignalMaker
