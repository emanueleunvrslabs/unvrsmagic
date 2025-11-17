"use client"

import type React from "react"
import { SettingsSection } from "../shared/settings-section"
import { ExchangesSection } from "./exchanges-section"
import { ProxiesSection } from "./proxies-section"
import type { ExchangeKey } from "../../types"

interface ExchangesTabProps {
  exchanges: ExchangeKey[]
  onExchangesChange: (exchanges: ExchangeKey[]) => void
}

export const ExchangesTab: React.FC<ExchangesTabProps> = ({
  exchanges,
  onExchangesChange,
}) => {
  return (
    <div className="space-y-6">
      <SettingsSection title="Exchange Connections" description="Connect and manage your crypto exchange accounts">
        <ExchangesSection exchanges={exchanges} onExchangesChange={onExchangesChange} />
      </SettingsSection>
      
      <SettingsSection title="Proxy Services" description="Configure proxy services for exchange connections">
        <ProxiesSection />
      </SettingsSection>
    </div>
  )
}
