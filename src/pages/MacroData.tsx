import { DashboardLayout } from "@/components/dashboard-layout";
import "@/components/labs/SocialMediaCard.css";

export default function MacroData() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="labs-client-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">MACRO.DATA Agent</h2>
          <p className="text-muted-foreground">
            Macroeconomic data analysis and market correlation tracking. Coming soon.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="labs-client-card p-4">
            <h3 className="font-medium text-foreground mb-2">Economic Indicators</h3>
            <p className="text-sm text-muted-foreground">GDP, inflation, employment data</p>
          </div>
          <div className="labs-client-card p-4">
            <h3 className="font-medium text-foreground mb-2">Central Banks</h3>
            <p className="text-sm text-muted-foreground">Interest rates and policy decisions</p>
          </div>
          <div className="labs-client-card p-4">
            <h3 className="font-medium text-foreground mb-2">Market Correlations</h3>
            <p className="text-sm text-muted-foreground">Cross-asset correlation analysis</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
