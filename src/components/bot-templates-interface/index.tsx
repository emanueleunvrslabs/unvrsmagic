"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { BotTemplate, BotCategory } from "./types"
import { useTemplates } from "./hooks/use-templates"
import { useFilters } from "./hooks/use-filters"
import { TemplateCard } from "./components/template-card"

const categories: BotCategory[] = ["All", "AI", "DeFi", "DCA", "Arbitrage", "Grid", "Scalping"]

export function BotTemplatesInterface() {
  const { templates, toggleFavorite, purchaseTemplate } = useTemplates()
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    activeTab,
    setActiveTab,
    filteredTemplates,
    resetFilters,
  } = useFilters(templates)

  const [selectedTemplate, setSelectedTemplate] = useState<BotTemplate | null>(null)

  const handleViewDetails = (template: BotTemplate) => {
    setSelectedTemplate(template)
    // TODO: Open details modal
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bot Templates</h1>
        <p className="text-muted-foreground">
          Browse, customize, and deploy trading bot templates for your crypto trading strategy
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="most-popular">Most Popular</SelectItem>
            <SelectItem value="highest-rated">Highest Rated</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="new-arrivals">New Arrivals</TabsTrigger>
          <TabsTrigger value="favorites">My Favorites</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "secondary" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mb-3 rounded-full bg-muted p-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-medium">No templates found</h3>
          <p className="mb-4 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onToggleFavorite={toggleFavorite}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}
