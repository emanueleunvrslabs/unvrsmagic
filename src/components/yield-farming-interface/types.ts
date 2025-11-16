export interface YieldFarmingOpportunity {
  id: number
  protocol: string
  asset: string
  chain: string
  farmType: string
  apy: number
  tvl: number
  risk: string
  impermanentLossRisk?: string
  rewards: string[]
  lockPeriod?: string
  logo?: string
}

export interface UserFarm {
  id: number
  protocol: string
  asset: string
  apy: number
  deposited: number
  earned: number
  logo?: string
}

export interface PortfolioAllocation {
  name: string
  value: number
  color: string
}

export interface FilterState {
  chain: string
  farmType: string
  riskLevel: string
  minApy: number
  searchQuery: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

export interface Transaction {
  id: string
  type: "deposit" | "withdraw" | "harvest" | "compound"
  protocol: string
  asset: string
  amount: number
  status: "pending" | "completed" | "failed"
  timestamp: Date
  txHash?: string
}

export interface TransactionState {
  pending: Transaction[]
  completed: Transaction[]
  failed: Transaction[]
}

export interface Notification {
  id: number
  type: "success" | "error" | "warning" | "harvest"
  message: string
  timestamp: Date
  read: boolean
}

export interface NotificationState {
  alerts: Notification[]
  settings: {
    harvest: boolean
    priceAlerts: boolean
    riskAlerts: boolean
    systemUpdates: boolean
  }
}

export interface WalletState {
  isConnected: boolean
  address?: string
  balance: number
  network?: string
}
