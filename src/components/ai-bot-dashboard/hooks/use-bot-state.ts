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
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true)
  const [realPortfolioData, setRealPortfolioData] = useState<any>(null)

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
        // Check if this is a "credentials not found" error - don't show toast for this
        const errorMessage = error.message || ''
        if (errorMessage.includes('credentials not found') || errorMessage.includes('404')) {
          console.log('Bitget credentials not configured yet')
        } else {
          console.error('Error fetching Bitget portfolio:', error)
          toast.error('Failed to fetch Bitget portfolio data')
        }
        return
      }

      if (data?.error) {
        // Handle error response from edge function
        if (data.error.includes('credentials not found')) {
          console.log('Bitget credentials not configured yet')
        } else {
          console.error('Bitget API error:', data.error)
          toast.error(data.error)
        }
        return
      }

      if (data?.success && data?.data) {
        const { totalValue, spot, futures, unrealizedPnL, breakdown } = data.data
        
        // Store complete breakdown data
        setRealPortfolioData(breakdown)
        
        // Update bot data with real portfolio value
        setBotData(prev => ({
          ...prev,
          balance: totalValue,
        }))
        
        console.log('Bitget portfolio loaded:', { totalValue, spot, futures, unrealizedPnL, breakdown })
      }
    } catch (error) {
      console.error('Exception fetching Bitget portfolio:', error)
      toast.error('Failed to load portfolio data')
    } finally {
      setIsLoadingPortfolio(false)
    }
  }

  // Load portfolio data on mount and set up auto-refresh
  useEffect(() => {
    fetchBitgetPortfolio()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBitgetPortfolio()
    }, 30000)
    
    return () => clearInterval(interval)
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

  return {
    botData,
    setBotData,
    botRunning,
    selectedStrategy,
    riskSettings,
    setRiskSettings: updateRiskSettings,
    isLoadingPortfolio,
    realPortfolioData,
    toggleBotStatus,
    handleStrategyChange,
    updateStrategies,
  }
}
