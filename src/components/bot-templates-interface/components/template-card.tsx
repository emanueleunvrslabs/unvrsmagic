"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Heart, Star, Bot, DollarSign, TrendingUp, TrendingDown, CheckCircle } from "lucide-react"
import type { BotTemplate } from "../types"

interface TemplateCardProps {
  template: BotTemplate
  onToggleFavorite: (templateId: string) => void
  onViewDetails: (template: BotTemplate) => void
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, typeof Bot> = {
    AI: Bot,
    DeFi: TrendingUp,
    DCA: DollarSign,
  }
  return icons[category] || Bot
}

const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    Beginner: "bg-green-500/20 text-green-500",
    Intermediate: "bg-yellow-500/20 text-yellow-500",
    Advanced: "bg-red-500/20 text-red-500",
  }
  return colors[level] || "bg-muted text-muted-foreground"
}

export const TemplateCard = memo(({ template, onToggleFavorite, onViewDetails }: TemplateCardProps) => {
  const CategoryIcon = getCategoryIcon(template.category)

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex gap-2">
        {template.isFeatured && (
          <Badge className="bg-primary text-primary-foreground">Featured</Badge>
        )}
        {template.isNew && (
          <Badge className="bg-green-500 text-white">New</Badge>
        )}
      </div>

      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
        onClick={() => onToggleFavorite(template.id)}
      >
        <Heart className={`h-4 w-4 ${template.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
      </Button>

      {/* Image */}
      <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        <img
          src={template.image}
          alt={template.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight line-clamp-1">{template.name}</h3>
          <span className="text-lg font-bold text-foreground">${template.price}</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CategoryIcon className="h-3 w-3" />
            {template.category}
          </Badge>
          <Badge variant="outline" className={getLevelColor(template.level)}>
            {template.level}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Win Rate</div>
            <div className="font-semibold">{template.winRate}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Profit Factor</div>
            <div className="font-semibold">{template.profitFactor}x</div>
          </div>
          <div>
            <div className="text-muted-foreground">Max Drawdown</div>
            <div className="font-semibold">{template.maxDrawdown}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg. Profit</div>
            <div className="font-semibold">{template.avgProfit}%</div>
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
            <Bot className="h-3 w-3 text-primary" />
          </div>
          <span className="font-medium">{template.creator.name}</span>
          {template.creator.verified && (
            <CheckCircle className="h-4 w-4 text-primary" />
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          <span className="font-semibold">{template.rating}</span>
          <span className="text-sm text-muted-foreground">({template.reviewCount})</span>
        </div>

        <Button onClick={() => onViewDetails(template)}>
          Details
        </Button>
      </CardFooter>
    </Card>
  )
})

TemplateCard.displayName = "TemplateCard"
