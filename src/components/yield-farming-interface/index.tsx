"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { PageHeader } from "./components/page-header"
import { PortfolioSummary } from "./components/portfolio-summary"
import { TabNavigation } from "./components/tab-navigation"
import { OpportunitiesTable } from "./components/opportunities-table"
import { MyFarmsGrid } from "./components/my-farms-grid"
import { PortfolioAllocationChart } from "./components/portfolio-allocation"
import { NotificationCenter } from "./components/notification-center"
import { WalletConnection } from "./components/wallet-connection"
import { TransactionHistory } from "./components/transaction-history"
import { OpportunityDetailModal } from "./components/modals/opportunity-detail-modal"
import { useYieldFarming } from "./hooks/use-yield-farming"
import type { YieldFarmingOpportunity, NotificationState, WalletState, TransactionState } from "./types"

export function YieldFarmingInterface() {
  const { opportunities, userFarms, favoriteOpportunities, filters, toggleFavorite, updateFilters, totalPortfolioValue, totalRewards } = useYieldFarming()
  
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<YieldFarmingOpportunity | null>(null)
  const [gasOption, setGasOption] = useState("average")
  const [autocompoundEnabled, setAutocompoundEnabled] = useState(true)
  const [harvestThreshold, setHarvestThreshold] = useState(100)

  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    balance: 0,
  })

  const [transactionState] = useState<TransactionState>({
    pending: [],
    completed: [],
    failed: [],
  })

  const [notifications, setNotifications] = useState<NotificationState>({
    alerts: [],
    settings: {
      harvest: true,
      priceAlerts: true,
      riskAlerts: true,
      systemUpdates: true,
    },
  })

  const portfolioData = [
    { name: "Liquidity Pools", value: totalPortfolioValue * 0.6, color: "#8b5cf6" },
    { name: "Staking", value: totalPortfolioValue * 0.25, color: "#3b82f6" },
    { name: "Lending", value: totalPortfolioValue * 0.15, color: "#10b981" },
  ]

  const handleConnect = () => {
    setWalletState({
      isConnected: true,
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
      balance: 15000,
      network: "Ethereum",
    })
  }

  const handleDisconnect = () => {
    setWalletState({
      isConnected: false,
      balance: 0,
    })
  }

  const filteredOpportunitiesByTab = () => {
    switch (activeTab) {
      case "my-farms":
        return []
      case "favorites":
        return opportunities.filter((opp) => favoriteOpportunities.includes(opp.id))
      case "analytics":
        return []
      default:
        return opportunities
    }
  }

  const averageApy = userFarms.length > 0 ? userFarms.reduce((total, farm) => total + farm.apy, 0) / userFarms.length : 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader />
        <div className="flex items-center gap-2">
          <NotificationCenter
            notifications={notifications}
            onMarkRead={() => {}}
            onClearAll={() => setNotifications((prev) => ({ ...prev, alerts: [] }))}
            onUpdateSettings={(settings) =>
              setNotifications((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }))
            }
          />
          <WalletConnection walletState={walletState} onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>
      </div>

      <PortfolioSummary
        totalPortfolioValue={totalPortfolioValue}
        totalRewards={totalRewards}
        userFarms={userFarms}
        gasOption={gasOption}
        onGasOptionChange={setGasOption}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query)
            updateFilters({ searchQuery: query })
          }}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        <TabsContent value="all" className="space-y-4">
          <OpportunitiesTable
            opportunities={filteredOpportunitiesByTab()}
            favoriteOpportunities={favoriteOpportunities}
            filters={filters}
            onFiltersChange={updateFilters}
            onToggleFavorite={toggleFavorite}
            onSelectOpportunity={setSelectedOpportunity}
          />
        </TabsContent>

        <TabsContent value="my-farms" className="space-y-4">
          <MyFarmsGrid userFarms={userFarms} onStartFarming={() => setActiveTab("all")} />
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <OpportunitiesTable
            opportunities={filteredOpportunitiesByTab()}
            favoriteOpportunities={favoriteOpportunities}
            filters={filters}
            onFiltersChange={updateFilters}
            onToggleFavorite={toggleFavorite}
            onSelectOpportunity={setSelectedOpportunity}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PortfolioAllocationChart
              portfolioData={portfolioData}
              totalPortfolioValue={totalPortfolioValue}
              totalRewards={totalRewards}
              userFarms={userFarms}
            />
            <TransactionHistory transactionState={transactionState} />
          </div>
        </TabsContent>
      </Tabs>

      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          gasOption={gasOption}
          autocompoundEnabled={autocompoundEnabled}
          harvestThreshold={harvestThreshold}
          onClose={() => setSelectedOpportunity(null)}
          onGasOptionChange={setGasOption}
          onAutocompoundChange={setAutocompoundEnabled}
          onHarvestThresholdChange={setHarvestThreshold}
          onOpenIlCalculator={() => {}}
          walletConnected={walletState.isConnected}
          walletBalance={walletState.balance}
        />
      )}
    </div>
  )
}
