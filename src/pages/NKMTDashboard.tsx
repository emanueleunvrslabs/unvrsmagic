import { DashboardLayout } from "@/components/dashboard-layout"
import { NKMTDashboardInterface } from "@/components/nkmt-agents/nkmt-dashboard/nkmt-dashboard-interface"

const NKMTDashboard = () => {
  return (
    <DashboardLayout>
      <NKMTDashboardInterface />
    </DashboardLayout>
  )
}

export default NKMTDashboard