"use client"

import { useState, useMemo } from "react"
import type { BotTemplate, BotCategory } from "../types"

export const useFilters = (templates: BotTemplate[]) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<BotCategory>("All")
  const [sortBy, setSortBy] = useState<string>("most-popular")
  const [activeTab, setActiveTab] = useState("all")

  const filteredTemplates = useMemo(() => {
    let filtered = templates

    // Apply tab filter
    if (activeTab === "featured") {
      filtered = filtered.filter((t) => t.isFeatured)
    } else if (activeTab === "new-arrivals") {
      filtered = filtered.filter((t) => t.isNew)
    } else if (activeTab === "favorites") {
      filtered = filtered.filter((t) => t.isFavorite)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((template) => template.category === selectedCategory)
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "most-popular":
          return b.reviewCount - a.reviewCount
        case "highest-rated":
          return b.rating - a.rating
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "newest":
          return b.isNew ? 1 : -1
        default:
          return 0
      }
    })

    return filtered
  }, [templates, searchQuery, selectedCategory, sortBy, activeTab])

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("All")
    setSortBy("most-popular")
  }

  return {
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
  }
}
