import { DashboardLayout } from "@/components/dashboard-layout";
import { ExchangesSection } from "@/components/settings-interface/components/exchanges/exchanges-section";
import "@/components/wallet/SocialMediaCard.css";

export default function NKMTExchange() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="labs-client-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Exchange Connections</h2>
          <p className="text-muted-foreground mb-6">
            Connect and manage your cryptocurrency exchange accounts for trading and portfolio tracking.
          </p>
          <ExchangesSection exchanges={[]} onExchangesChange={() => {}} />
        </div>
      </div>
    </DashboardLayout>
  );
}
