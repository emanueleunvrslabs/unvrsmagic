"use client"

import { Eye, Settings, History, Trash, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "../utils"
import type { BotData, Asset } from "../types"

interface SpotAccount {
  coin: string
  available: string
  frozen: string
  locked: string
  usdtValue: string
}

interface FuturesAccount {
  marginCoin: string
  available: string
}

interface FuturesPosition {
  symbol: string
  total: string
  unrealizedPL: string
  holdSide: string
}

interface RealPortfolioData {
  spotAccounts?: SpotAccount[]
  futuresAccounts?: FuturesAccount[]
  positions?: FuturesPosition[]
}

interface DisplayAsset {
  symbol: string
  amount: number
  type: string
  value: number
  side?: string
  allocation: number
  price: number
  change24h: number
}

interface PortfolioSectionProps {
  botData: BotData
  realPortfolioData: RealPortfolioData | null
  isLoading: boolean
  onAssetAction: (asset: Asset, action: string) => void
}

export function PortfolioSection({ botData, realPortfolioData, isLoading, onAssetAction }: PortfolioSectionProps) {
  // Transform real portfolio data into displayable format
  const displayAssets: DisplayAsset[] = realPortfolioData ? [
    // Spot assets
    ...(realPortfolioData.spotAccounts || []).map((coin) => {
      const total = parseFloat(coin.available || '0') + parseFloat(coin.frozen || '0') + parseFloat(coin.locked || '0')
      return {
        symbol: coin.coin,
        amount: total,
        type: 'Spot',
        value: parseFloat(coin.usdtValue || '0'),
        allocation: 0,
        price: 0,
        change24h: 0
      }
    }).filter((asset) => asset.amount > 0),
    // Futures account balance
    ...(realPortfolioData.futuresAccounts || []).map((account) => ({
      symbol: account.marginCoin,
      amount: parseFloat(account.available || '0'),
      type: 'Futures',
      value: parseFloat(account.available || '0'),
      allocation: 0,
      price: 0,
      change24h: 0
    })).filter((asset) => asset.amount > 0),
    // Futures positions
    ...(realPortfolioData.positions || []).map((position) => ({
      symbol: position.symbol,
      amount: parseFloat(position.total || '0'),
      type: 'Futures Position',
      value: parseFloat(position.unrealizedPL || '0'),
      side: position.holdSide,
      allocation: 0,
      price: 0,
      change24h: 0
    })).filter((asset) => asset.amount > 0)
  ] : botData.assets.map(a => ({ ...a, amount: a.allocation, type: 'Asset', value: a.price * a.allocation }))

  return (
    <>
      {/* Asset table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Asset Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Value (USDT)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : displayAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                displayAssets.map((asset) => (
                  <TableRow key={`${asset.symbol}-${asset.type}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <img 
                          src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`}
                          alt={asset.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {asset.symbol}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{asset.type}</Badge>
                      {asset.side && <Badge variant="secondary" className="ml-2">{asset.side}</Badge>}
                    </TableCell>
                    <TableCell>{asset.amount.toFixed(8)}</TableCell>
                    <TableCell>{formatCurrency(asset.value)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onAssetAction(asset, "details")}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAssetAction(asset, "adjust")}>
                            <Settings className="mr-2 h-4 w-4" />
                            Adjust Allocation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAssetAction(asset, "history")}>
                            <History className="mr-2 h-4 w-4" />
                            Trade History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => onAssetAction(asset, "remove")}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Remove from Portfolio
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
