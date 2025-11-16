"use client"

import { Plus, Zap, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { formatCurrency } from "../utils"
import type { UserFarm } from "../types"

interface MyFarmsGridProps {
  userFarms: UserFarm[]
  onStartFarming?: () => void
  onAddToFarm?: (farmId: number, amount: number) => void
  onHarvestFarm?: (farmId: number) => void
  onWithdrawFromFarm?: (farmId: number, amount: number) => void
}

export function MyFarmsGrid({
  userFarms,
  onStartFarming,
  onAddToFarm,
  onHarvestFarm,
  onWithdrawFromFarm,
}: MyFarmsGridProps) {
  const [selectedFarm, setSelectedFarm] = useState<UserFarm | null>(null)
  const [actionType, setActionType] = useState<"add" | "withdraw" | null>(null)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (farm: UserFarm, type: "add" | "harvest" | "withdraw") => {
    if (type === "harvest") {
      setIsLoading(true)
      try {
        await onHarvestFarm?.(farm.id)
      } finally {
        setIsLoading(false)
      }
      return
    }

    setSelectedFarm(farm)
    setActionType(type)
  }

  const handleSubmitAction = async () => {
    if (!selectedFarm || !actionType || !amount) return

    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return

    setIsLoading(true)
    try {
      if (actionType === "add") {
        await onAddToFarm?.(selectedFarm.id, numAmount)
      } else if (actionType === "withdraw") {
        await onWithdrawFromFarm?.(selectedFarm.id, numAmount)
      }

      // Reset form
      setAmount("")
      setSelectedFarm(null)
      setActionType(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedFarm(null)
    setActionType(null)
    setAmount("")
  }

  const getMaxAmount = () => {
    if (!selectedFarm) return 0
    return actionType === "withdraw" ? selectedFarm.deposited : 10000 // Assuming max add is $10,000
  }

  if (userFarms.length === 0) {
    return (
      <Card className="flex h-[200px] flex-col items-center justify-center">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No Active Farms</h3>
          <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have any active yield farming positions yet.</p>
          <Button className="mt-4" onClick={onStartFarming}>
            <Plus className="mr-2 h-4 w-4" />
            Start Farming
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userFarms.map((farm) => (
          <Card key={farm.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={farm.logo || "/placeholder.svg"}
                    alt={farm.protocol}
                    className="mr-2 h-8 w-8 rounded-full"
                  />
                  <div>
                    <CardTitle className="text-base">{farm.protocol}</CardTitle>
                    <CardDescription>{farm.asset}</CardDescription>
                  </div>
                </div>
                <Badge variant="default">{farm.apy.toFixed(2)}%</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposited:</span>
                <span className="font-medium">{formatCurrency(farm.deposited)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Earned:</span>
                <span className="font-medium text-green-500">{formatCurrency(farm.earned)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium">{formatCurrency(farm.deposited + farm.earned)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAction(farm, "add")}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => handleAction(farm, "harvest")}
                disabled={isLoading || farm.earned === 0}
              >
                <Zap className="mr-1 h-3 w-3" />
                Harvest
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAction(farm, "withdraw")}>
                Withdraw
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Action Modal */}
      {selectedFarm && actionType && (
        <Dialog open={true} onOpenChange={handleCloseModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "add" ? "Add to" : "Withdraw from"} {selectedFarm.protocol}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={getMaxAmount()}
                  />
                  <Button variant="outline" onClick={() => setAmount(getMaxAmount().toString())}>
                    Max
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {actionType === "withdraw"
                    ? `Available: ${formatCurrency(selectedFarm.deposited)}`
                    : `Max: ${formatCurrency(getMaxAmount())}`}
                </p>
              </div>

              {amount && Number.parseFloat(amount) > 0 && (
                <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">APY:</span>
                    <span className="font-medium">{selectedFarm.apy.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Monthly:</span>
                    <span className="font-medium">
                      {formatCurrency((Number.parseFloat(amount) * selectedFarm.apy) / 100 / 12)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmitAction} disabled={isLoading || !amount} className="flex-1">
                  {isLoading ? "Processing..." : actionType === "add" ? "Add Funds" : "Withdraw"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
