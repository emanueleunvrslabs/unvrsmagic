"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Star, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency, formatHoldings, formatPercentage, getChangeColor } from "../../utils"
import type { Asset } from "../../types"

interface AssetsTableProps {
  assets: Asset[]
  onAssetClick?: (asset: Asset) => void
}

type SortField = "name" | "value" | "holdings" | "price" | "pnl" | "allocation"
type SortDirection = "asc" | "desc"

export function AssetsTable({ assets, onAssetClick }: AssetsTableProps) {
  const [sortField, setSortField] = useState<SortField>("value")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const toggleFavorite = (assetId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newFavorites = new Set(favorites)
    if (favorites.has(assetId)) {
      newFavorites.delete(assetId)
    } else {
      newFavorites.add(assetId)
    }
    setFavorites(newFavorites)
  }

  const sortedAssets = [...assets].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortField) {
      case "name":
        aValue = a.name
        bValue = b.name
        break
      case "value":
        aValue = a.value
        bValue = b.value
        break
      case "holdings":
        aValue = a.holdings
        bValue = b.holdings
        break
      case "price":
        aValue = a.price
        bValue = b.price
        break
      case "pnl":
        aValue = a.pnl
        bValue = b.pnl
        break
      case "allocation":
        aValue = a.allocation
        bValue = b.allocation
        break
      default:
        aValue = a.value
        bValue = b.value
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort(field)}>
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>
              <SortButton field="name">Asset</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="price">Price</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="holdings">Holdings</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="value">Value</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="allocation">Allocation</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="pnl">P&L</SortButton>
            </TableHead>
            <TableHead>Chain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAssets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No assets found.
              </TableCell>
            </TableRow>
          ) : (
            sortedAssets.map((asset) => (
              <TableRow
                key={asset.id}
                className="cursor-pointer"
                onClick={() => onAssetClick?.(asset)}
              >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => toggleFavorite(asset.id, e)}
                  >
                    <Star
                      className={`h-4 w-4 ${favorites.has(asset.id) ? "fill-yellow-400 text-yellow-400" : ""}`}
                    />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={asset.icon}
                      alt={asset.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">{asset.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">${formatCurrency(asset.price)}</TableCell>
                <TableCell className="text-right">
                  {formatHoldings(asset.holdings)} {asset.symbol}
                </TableCell>
                <TableCell className="text-right font-medium">${formatCurrency(asset.value)}</TableCell>
                <TableCell className="text-right">{asset.allocation.toFixed(2)}%</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <div className={getChangeColor(asset.pnl)}>
                      ${formatCurrency(Math.abs(asset.pnl))}
                    </div>
                    {asset.pnl >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{asset.chain}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
