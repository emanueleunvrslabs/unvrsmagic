"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalControls } from "./components/global-controls"
import { HeaderStats } from "./components/header-stats"
import { OverviewTab } from "./components/overview-tab"
import { BotsTab } from "./components/bots-tab"
import { ExchangesTab } from "./components/exchanges-tab"
import { BotDetailsHeader } from "./components/bot-details/bot-details-header"
import { PerformanceTab } from "./components/bot-details/performance-tab"
import { AlertsTab } from "./components/bot-details/alerts-tab"
import { SettingsTab } from "./components/bot-details/settings-tab"
import { TradesTab } from "./components/bot-details/trades-tab"
import { mockBots, mockExchanges, mockOpportunities, mockStats } from "./data"
import { CreateBotModal } from "./components/modals/create-bot-modal"
import type { ArbitrageBot, GlobalBotStatus } from "./types"

export default function ArbitrageBotDashboard() {
  const [globalBotStatus, setGlobalBotStatus] = useState<GlobalBotStatus>("active")
  const [bots, setBots] = useState(mockBots)
  const [exchanges, setExchanges] = useState(mockExchanges)
  const [opportunities] = useState(mockOpportunities)
  const [selectedBot, setSelectedBot] = useState<ArbitrageBot | null>(null)
  const [isCreateBotOpen, setIsCreateBotOpen] = useState(false)

  const activeBots = bots.filter((bot) => bot.status === "active")
  const pausedBots = bots.filter((bot) => bot.status === "paused")
  const stoppedBots = bots.filter((bot) => bot.status === "stopped")
  const activeOpportunities = opportunities.filter((opp) => opp.status === "active")
  const connectedExchanges = exchanges.filter((ex) => ex.status === "connected")
  const disconnectedExchanges = exchanges.filter((ex) => ex.status !== "connected")

  const handleToggleGlobalStatus = () => {
    setGlobalBotStatus((prev) => (prev === "active" ? "paused" : "active"))
  }

  const handlePauseBot = (botId: string) => {
    setBots((prev) => prev.map((bot) => (bot.id === botId ? { ...bot, status: "paused" as const } : bot)))
  }

  const handleResumeBot = (botId: string) => {
    setBots((prev) => prev.map((bot) => (bot.id === botId ? { ...bot, status: "active" as const } : bot)))
  }

  const handleConnectExchange = (exchangeId: string) => {
    setExchanges((prev) =>
      prev.map((exchange) => (exchange.id === exchangeId ? { ...exchange, status: "connected" as const } : exchange)),
    )
  }

  const handleDisconnectExchange = (exchangeId: string) => {
    setExchanges((prev) =>
      prev.map((exchange) => (exchange.id === exchangeId ? { ...exchange, status: "disconnected" as const } : exchange)),
    )
  }

  const handleCreateBot = async (botData: Partial<ArbitrageBot>) => {
    const newBot: ArbitrageBot = {
      id: String(Date.now()),
      name: botData.name || "New Bot",
      description: botData.description || "",
      status: "paused",
      exchanges: botData.exchanges || [],
      pairs: botData.pairs || [],
      minSpread: botData.minSpread || 0.5,
      profitThreshold: botData.profitThreshold || 100,
      successRate: 0,
      totalProfit: 0,
      totalTrades: 0,
      createdAt: new Date(),
      strategy: botData.strategy || "basic",
      riskLevel: botData.riskLevel || "medium",
    }
    setBots((prev) => [...prev, newBot])
    setIsCreateBotOpen(false)
  }

  const handleExecuteOpportunity = (opportunityId: string) => {
    console.log("Executing opportunity:", opportunityId)
  }

  const handleViewBot = (bot: ArbitrageBot) => {
    setSelectedBot(bot)
  }

  const handleDeleteBot = (botId: string) => {
    setBots((prev) => prev.filter((bot) => bot.id !== botId))
  }

  const handleBackFromBotDetails = () => {
    setSelectedBot(null)
  }

  const mockHistoricalData = {
    dailyProfits: [
      { date: "Mon", profit: 120 },
      { date: "Tue", profit: 180 },
      { date: "Wed", profit: 95 },
      { date: "Thu", profit: 240 },
      { date: "Fri", profit: 160 },
      { date: "Sat", profit: 320 },
      { date: "Sun", profit: 280 },
    ],
    spreadHistory: [
      { timestamp: "00:00", spread: 0.5 },
      { timestamp: "04:00", spread: 0.7 },
      { timestamp: "08:00", spread: 1.2 },
      { timestamp: "12:00", spread: 0.9 },
      { timestamp: "16:00", spread: 1.5 },
      { timestamp: "20:00", spread: 1.1 },
    ],
    volumeHistory: [
      { timestamp: "00:00", volume: 5000 },
      { timestamp: "04:00", volume: 7500 },
      { timestamp: "08:00", volume: 12000 },
      { timestamp: "12:00", volume: 9000 },
      { timestamp: "16:00", volume: 15000 },
      { timestamp: "20:00", volume: 11000 },
    ],
  }

  const mockAlerts = [
    {
      id: "1",
      type: "success" as const,
      message: "Bot successfully executed trade with 2.5% profit",
      timestamp: new Date(),
      read: false,
    },
    {
      id: "2",
      type: "warning" as const,
      message: "Low liquidity detected on Binance for BTC/USDT",
      timestamp: new Date(),
      read: false,
    },
  ]

  if (selectedBot) {
    return (
      <div className="space-y-6 p-6">
        <BotDetailsHeader bot={selectedBot} onBack={handleBackFromBotDetails} />
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="performance" className="space-y-4">
            <PerformanceTab bot={selectedBot} historicalData={mockHistoricalData} />
          </TabsContent>
          <TabsContent value="trades" className="space-y-4">
            <TradesTab trades={[]} />
          </TabsContent>
          <TabsContent value="alerts" className="space-y-4">
            <AlertsTab alerts={mockAlerts} />
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            <SettingsTab bot={selectedBot} />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <GlobalControls
        globalBotStatus={globalBotStatus}
        onToggleGlobalStatus={handleToggleGlobalStatus}
        onCreateBot={() => setIsCreateBotOpen(true)}
      />

      <HeaderStats
        activeOpportunitiesCount={activeOpportunities.length}
        activeBotsCount={activeBots.length}
        totalBotsCount={bots.length}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bots">Bots ({bots.length})</TabsTrigger>
          <TabsTrigger value="exchanges">Exchanges ({exchanges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            activeBots={activeBots}
            activeOpportunities={activeOpportunities}
            onCreateBot={() => setIsCreateBotOpen(true)}
            onExecuteOpportunity={handleExecuteOpportunity}
          />
        </TabsContent>

        <TabsContent value="bots" className="space-y-4">
          <BotsTab
            activeBots={activeBots}
            pausedBots={pausedBots}
            stoppedBots={stoppedBots}
            allBots={bots}
            onCreateBot={() => setIsCreateBotOpen(true)}
            onPauseBot={handlePauseBot}
            onResumeBot={handleResumeBot}
            onDeleteBot={handleDeleteBot}
            onSelectBot={handleViewBot}
          />
        </TabsContent>

        <TabsContent value="exchanges" className="space-y-4">
          <ExchangesTab
            connectedExchanges={connectedExchanges}
            disconnectedExchanges={disconnectedExchanges}
            allExchanges={exchanges}
            onConnectExchange={handleConnectExchange}
            onDisconnectExchange={handleDisconnectExchange}
          />
        </TabsContent>
      </Tabs>

      <CreateBotModal
        isOpen={isCreateBotOpen}
        exchanges={exchanges}
        onClose={() => setIsCreateBotOpen(false)}
        onCreateBot={handleCreateBot}
      />
    </div>
  )
}
