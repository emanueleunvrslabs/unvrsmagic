export interface ArbitrageBot {
  id: string
  name: string
  description?: string
  status: "active" | "paused" | "stopped"
  exchanges: string[]
  pairs: string[]
  minSpread: number
  profitThreshold: number
  successRate: number
  totalProfit: number
  totalTrades?: number
  createdAt?: Date
  strategy?: string
  riskLevel?: string
  maxVolume?: number
  settings?: Record<string, any>
}

export interface Exchange {
  id: string
  name: string
  logo?: string
  status: "connected" | "disconnected" | "error"
  apiKeyConfigured: boolean
  balance?: number
  tradingFees?: number
}

export interface ArbitrageOpportunity {
  id: string
  pair: string
  buyExchange: string
  sellExchange: string
  buyPrice: number
  sellPrice: number
  spread: number
  profit: number
  volume: number
  timestamp: Date
  status: "active" | "completed" | "failed"
  estimatedExecutionTime?: number
  executionTime?: number
  risk?: string
}

export type GlobalBotStatus = "active" | "paused"
