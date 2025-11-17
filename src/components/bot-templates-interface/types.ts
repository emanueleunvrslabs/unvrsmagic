export type BotCategory = "All" | "AI" | "DeFi" | "DCA" | "Arbitrage" | "Grid" | "Scalping"

export type TemplateLevel = "Beginner" | "Intermediate" | "Advanced"

export interface BotTemplate {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  level: TemplateLevel
  isFeatured: boolean
  isNew: boolean
  isFavorite: boolean
  isPurchased: boolean
  winRate: number
  profitFactor: number
  maxDrawdown: number
  avgProfit: number
  creator: {
    name: string
    verified: boolean
    avatar?: string
  }
  rating: number
  reviewCount: number
}
