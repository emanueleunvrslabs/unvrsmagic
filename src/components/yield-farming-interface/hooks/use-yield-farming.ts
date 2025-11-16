"use client"

import { useState, useMemo } from "react"
import type { FilterState, YieldFarmingOpportunity, UserFarm } from "../types"
import { mockOpportunities, mockUserFarms } from "../data"

export const useYieldFarming = () => {
  const [opportunities] = useState<YieldFarmingOpportunity[]>(mockOpportunities)
  const [userFarms] = useState<UserFarm[]>(mockUserFarms)
  const [favoriteOpportunities, setFavoriteOpportunities] = useState<number[]>([])
  const [filters, setFilters] = useState<FilterState>({
    chain: "All",
    farmType: "All",
    riskLevel: "All",
    minApy: 0,
    searchQuery: "",
    sortBy: "apy",
    sortOrder: "desc",
  })

  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities.filter((opp) => {
      if (filters.chain !== "All" && opp.chain !== filters.chain) return false
      if (filters.farmType !== "All" && opp.farmType !== filters.farmType) return false
      if (filters.riskLevel !== "All" && opp.risk !== filters.riskLevel) return false
      if (opp.apy < filters.minApy) return false
      if (
        filters.searchQuery &&
        !opp.protocol.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !opp.asset.toLowerCase().includes(filters.searchQuery.toLowerCase())
      )
        return false
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (filters.sortBy) {
        case "apy":
          comparison = a.apy - b.apy
          break
        case "tvl":
          comparison = a.tvl - b.tvl
          break
        case "risk":
          comparison = a.risk.localeCompare(b.risk)
          break
        case "protocol":
          comparison = a.protocol.localeCompare(b.protocol)
          break
      }
      return filters.sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [opportunities, filters])

  const toggleFavorite = (id: number) => {
    setFavoriteOpportunities((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id],
    )
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const totalPortfolioValue = useMemo(
    () => userFarms.reduce((total, farm) => total + farm.deposited + farm.earned, 0),
    [userFarms],
  )

  const totalRewards = useMemo(() => userFarms.reduce((total, farm) => total + farm.earned, 0), [userFarms])

  return {
    opportunities: filteredOpportunities,
    userFarms,
    favoriteOpportunities,
    filters,
    toggleFavorite,
    updateFilters,
    totalPortfolioValue,
    totalRewards,
  }
}
