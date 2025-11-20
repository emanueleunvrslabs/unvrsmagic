import { DashboardLayout } from "@/components/dashboard-layout"
import { NKMTDashboardInterface } from "@/components/nkmt-agents/nkmt-dashboard/nkmt-dashboard-interface"
import { NKMTLogsViewer } from "@/components/nkmt-agents/nkmt-dashboard/nkmt-logs-viewer"

const NKMTDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NKMTDashboardInterface />
        <NKMTLogsViewer />
      </div>
    </DashboardLayout>
  )
}

export default NKMTDashboard