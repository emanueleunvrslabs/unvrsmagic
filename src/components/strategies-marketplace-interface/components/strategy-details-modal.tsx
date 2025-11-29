"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Download, Share2, Heart, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Strategy } from "../types"
import { formatNumber, getReturnColor, formatPercentage } from "../utils"
import { StarRating } from "./star-rating"
import { CreatorInfo } from "./creator-info"
import { PerformanceChart } from "./performance-chart"
import { RiskMetrics } from "./risk-metrics"
import { TradingDetails } from "./trading-details"
import { PurchaseOptions } from "./purchase-options"

interface StrategyDetailsModalProps {
  strategy: Strategy | null
  isOpen: boolean
  onClose: () => void
  onToggleFavorite: (id: string) => void
  onPurchase?: (strategyId: string) => void
}

const getReturnIcon = (value: number) => {
  if (value > 0) return "↗"
  if (value < 0) return "↘"
  return ""
}

export function StrategyDetailsModal({
  strategy,
  isOpen,
  onClose,
  onToggleFavorite,
  onPurchase,
}: StrategyDetailsModalProps) {
  if (!strategy) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{strategy.name}</DialogTitle>
          <DialogDescription>{strategy.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-3">
          {/* Left column - Performance metrics */}
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="mb-4 text-lg font-semibold">Risk Metrics</h3>
                <RiskMetrics strategy={strategy} />
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-4 text-lg font-semibold">Trading Details</h3>
                <TradingDetails strategy={strategy} />
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Creator</h3>
              <CreatorInfo creator={strategy.creator} showDetails />
            </div>
          </div>

          {/* Right column - Strategy details */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Strategy Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Projects</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contact Persons</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <Separator />
                <Button className="w-full gap-1" onClick={() => onPurchase?.(strategy.id)}>
                  <ShoppingCart className="h-4 w-4" />
                  <span>New Project</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => onToggleFavorite(strategy.id)}>
                <Heart className={cn("h-4 w-4", strategy.isFavorite ? "fill-red-500 text-red-500" : "")} />
                <span>{strategy.isFavorite ? "Favorited" : "Add to Favorites"}</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="gap-1">
            <Download className="h-4 w-4" />
            <span>Download Whitepaper</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
