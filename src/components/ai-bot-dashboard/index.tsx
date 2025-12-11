"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { Header } from "./components/header";
import { KpiCards } from "./components/kpi-cards";
import { AdjustAllocationModal } from "./components/modals/adjust-allocation-modal";
import { AssetDetailsModal } from "./components/modals/asset-details-modal";
import { RemoveAssetModal } from "./components/modals/remove-asset-modal";
import { TradeHistoryModal } from "./components/modals/trade-history-modal";
import { OverviewSection } from "./components/overview-section";
import { PortfolioSection } from "./components/portfolio-section";
import { SettingsSection } from "./components/settings-section";
import { StrategySection } from "./components/strategy-section";
import { TradesSection } from "./components/trades-section";
import { useBotState } from "./hooks/use-bot-state";
import type { Asset } from "./types";

export function AiBotDashboard() {
  const { botData, setBotData, botRunning, selectedStrategy, riskSettings, setRiskSettings, isLoadingPortfolio, realPortfolioData, toggleBotStatus, handleStrategyChange } = useBotState();

  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Asset modal states
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  const [showAdjustAllocation, setShowAdjustAllocation] = useState(false);
  const [showTradeHistory, setShowTradeHistory] = useState(false);
  const [showRemoveAsset, setShowRemoveAsset] = useState(false);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);

    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };

  // Effect to handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle navigation to trades page
  const handleViewAllTrades = () => {
    // Navigation would be handled here
  };

  // Handle navigation to AI insights page
  const handleViewAllInsights = () => {
    // Navigation would be handled here
  };

  // Handle asset actions
  const handleAssetAction = (asset: Asset, action: string) => {
    setSelectedAsset(asset);
    switch (action) {
      case "details":
        setShowAssetDetails(true);
        break;
      case "adjust":
        setShowAdjustAllocation(true);
        break;
      case "history":
        setShowTradeHistory(true);
        break;
      case "remove":
        setShowRemoveAsset(true);
        break;
      default:
        break;
    }
  };

  // Handle asset allocation adjustment
  const handleAdjustAllocation = (asset: Asset, newAllocation: number) => {
    const updatedAssets = botData.assets.map((a) => (a.symbol === asset.symbol ? { ...a, allocation: newAllocation } : a));

    setBotData({
      ...botData,
      assets: updatedAssets,
    });
  };

  // Handle asset removal
  const handleRemoveAsset = (asset: Asset) => {
    const updatedAssets = botData.assets.filter((a) => a.symbol !== asset.symbol);

    // Redistribute the allocation
    const removedAllocation = asset.allocation;
    const totalRemainingAllocation = updatedAssets.reduce((sum, a) => sum + a.allocation, 0);

    if (totalRemainingAllocation > 0) {
      const scaleFactor = 100 / totalRemainingAllocation;

      updatedAssets.forEach((a) => {
        a.allocation = Math.round(a.allocation * scaleFactor * 100) / 100;
      });
    }

    setBotData({
      ...botData,
      assets: updatedAssets,
    });
  };

  return (
    <div className={cn("space-y-6", isFullscreen && "fixed inset-0 z-50 bg-background p-6 overflow-auto")}>
      <Header exchangeName="Bitget" botRunning={botRunning} isFullscreen={isFullscreen} onToggleBotStatus={toggleBotStatus} onToggleFullscreen={toggleFullscreen} />

      <KpiCards botData={botData} isLoading={isLoadingPortfolio} />

      {/* Main content tabs */}
      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-3 min-w-[350px] lg:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <OverviewSection botData={botData} onViewAllTrades={handleViewAllTrades} onViewAllInsights={handleViewAllInsights} />
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          <PortfolioSection botData={botData} realPortfolioData={realPortfolioData} isLoading={isLoadingPortfolio} onAssetAction={handleAssetAction} />
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades" className="space-y-4">
          <TradesSection botData={botData} />
        </TabsContent>
      </Tabs>

      {/* Asset Management Modals */}
      <AssetDetailsModal asset={selectedAsset} isOpen={showAssetDetails} onClose={() => setShowAssetDetails(false)} />

      <AdjustAllocationModal asset={selectedAsset} isOpen={showAdjustAllocation} onClose={() => setShowAdjustAllocation(false)} onSave={handleAdjustAllocation} totalBalance={botData.balance} />

      <TradeHistoryModal asset={selectedAsset} isOpen={showTradeHistory} onClose={() => setShowTradeHistory(false)} />

      <RemoveAssetModal asset={selectedAsset} isOpen={showRemoveAsset} onClose={() => setShowRemoveAsset(false)} onConfirm={handleRemoveAsset} totalBalance={botData.balance} />
    </div>
  );
}
