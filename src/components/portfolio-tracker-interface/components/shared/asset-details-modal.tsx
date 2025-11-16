"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import type { Asset } from "../../types";
import { formatCurrency, formatPercentage, getChangeColor } from "../../utils";

interface AssetDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
}

export function AssetDetailsModal({ open, onOpenChange, asset }: AssetDetailsModalProps) {
  if (!asset) return null;

  const totalPnL = asset.value - asset.cost;
  const pnlPercentage = (totalPnL / asset.cost) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={asset.icon}
                alt={asset.name}
                className="h-10 w-10 rounded-full"
              />
              <div>
                <DialogTitle>{asset.name}</DialogTitle>
                <div className="text-sm text-muted-foreground">{asset.symbol}</div>
              </div>
            </div>
            <Badge variant="outline">{asset.chain}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className="text-lg font-bold">${formatCurrency(asset.price)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Holdings</div>
              <div className="text-lg font-bold">{asset.holdings} {asset.symbol}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Value</div>
              <div className="text-lg font-bold">${formatCurrency(asset.value)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">P&L</div>
              <div className={`text-lg font-bold flex items-center gap-1 ${getChangeColor(totalPnL)}`}>
                {totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                ${formatCurrency(Math.abs(totalPnL))} ({formatPercentage(pnlPercentage)})
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Asset Overview</h3>
                <p className="text-sm text-muted-foreground">
                  View detailed information about this asset including price history, market data, and more.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="transactions" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Transaction History</h3>
                <p className="text-sm text-muted-foreground">
                  No transactions recorded for this asset yet.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="stats" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Allocation</div>
                    <div className="font-medium">{asset.allocation.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cost Basis</div>
                    <div className="font-medium">${formatCurrency(asset.cost)}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.open(`https://coinmarketcap.com/currencies/${asset.symbol.toLowerCase()}`, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View on CoinMarketCap
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
