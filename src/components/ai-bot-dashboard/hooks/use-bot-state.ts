"use client"

import { useState, useEffect } from "react"
import { mockBotData } from "../data/mock-data"
import type { BotData, RiskSettings, Strategy } from "../types"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export function useBotState() {
  const [botData, setBotData] = useState<BotData>(mockBotData)
  const [botRunning, setBotRunning] = useState(botData.status === "active")
  const [selectedStrategy, setSelectedStrategy] = useState(botData.strategies.find((s) => s.active)?.id || "1")
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(botData.riskSettings)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true)

  // Fetch real Bitget portfolio data
  const fetchBitgetPortfolio = async () => {
    try {
      // Check if user is authenticated first
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('No active session, skipping portfolio fetch')
        setIsLoadingPortfolio(false)
        return
      }

      const { data, error } = await supabase.functions.invoke('get-bitget-portfolio', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      
      if (error) {
        console.error('Error fetching Bitget portfolio:', error)
        toast.error('Failed to fetch Bitget portfolio data')
        return
      }

      if (data?.success && data?.data) {
        const { totalValue, spot, futures, unrealizedPnL } = data.data
        
        // Update bot data with real portfolio value
        setBotData(prev => ({
          ...prev,
          balance: totalValue,
          // You can also update other fields based on real data
        }))
        
        console.log('Bitget portfolio loaded:', { totalValue, spot, futures, unrealizedPnL })
      }
    } catch (error) {
      console.error('Exception fetching Bitget portfolio:', error)
      toast.error('Failed to load portfolio data')
    } finally {
      setIsLoadingPortfolio(false)
    }
  }

  // Load portfolio data on mount
  useEffect(() => {
    fetchBitgetPortfolio()
  }, [])

  // Handle bot start/stop
  const toggleBotStatus = () => {
    setBotRunning(!botRunning)
    setBotData({
      ...botData,
      status: !botRunning ? "active" : "inactive",
    })
  }

  // Handle strategy change
  const handleStrategyChange = (strategyId: string) => {
    setSelectedStrategy(strategyId)

    // Update active strategy in bot data
    const updatedStrategies = botData.strategies.map((strategy) => ({
      ...strategy,
      active: strategy.id === strategyId,
    }))

    setBotData({
      ...botData,
      strategies: updatedStrategies,
    })
  }

  // Handle strategy updates
  const updateStrategies = (strategies: Strategy[]) => {
    setBotData({
      ...botData,
      strategies,
    })
  }

  // Handle risk settings update
  const updateRiskSettings = (settings: RiskSettings) => {
    setRiskSettings(settings)
    setBotData({
      ...botData,
      riskSettings: settings,
    })
  }

  // Handle refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchBitgetPortfolio()
    setIsRefreshing(false)
  }

  return {
    botData,
    setBotData,
    botRunning,
    selectedStrategy,
    riskSettings,
    setRiskSettings: updateRiskSettings,
    isRefreshing,
    isLoadingPortfolio,
    toggleBotStatus,
    handleStrategyChange,
    handleRefresh,
    updateStrategies,
  }
}
