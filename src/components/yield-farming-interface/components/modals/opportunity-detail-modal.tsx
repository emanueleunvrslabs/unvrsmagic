"use client"

import { useState } from "react"
import { ChevronDown, Info, Calculator, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CHAIN_ICONS, RISK_COLORS, GAS_OPTIONS } from "../../constants"
import { formatNumber, getImpermanentLossRiskValue, getRiskValue } from "../../utils"
import type { YieldFarmingOpportunity } from "../../types"

interface OpportunityDetailModalProps {
  opportunity: YieldFarmingOpportunity
  gasOption: string
  autocompoundEnabled: boolean
  harvestThreshold: number
  onClose: () => void
  onGasOptionChange: (option: string) => void
  onAutocompoundChange: (enabled: boolean) => void
  onHarvestThresholdChange: (threshold: number) => void
  onOpenIlCalculator: () => void
  onDeposit?: (amount: number) => void
  walletConnected?: boolean
  walletBalance?: number
}

export function OpportunityDetailModal({
  opportunity,
  gasOption,
  autocompoundEnabled,
  harvestThreshold,
  onClose,
  onGasOptionChange,
  onAutocompoundChange,
  onHarvestThresholdChange,
  onOpenIlCalculator,
  onDeposit,
  walletConnected = false,
  walletBalance = 0,
}: OpportunityDetailModalProps) {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [depositAmount, setDepositAmount] = useState<string>("")

  const gasData = GAS_OPTIONS[gasOption as keyof typeof GAS_OPTIONS] || GAS_OPTIONS.average

  const handleDeposit = () => {
    const amount = Number.parseFloat(depositAmount)
    if (amount > 0 && onDeposit) {
      onDeposit(amount)
      onClose()
    }
  }

  const handleMaxClick = () => {
    setDepositAmount(walletBalance.toString())
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={opportunity.logo || "/placeholder.svg"}
                alt={opportunity.protocol}
                className="mr-3 h-10 w-10 rounded-full"
              />
              <div>
                <div className="text-xl">
                  {opportunity.protocol} - {opportunity.asset}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <img
                      src={CHAIN_ICONS[opportunity.chain as keyof typeof CHAIN_ICONS] || "/placeholder.svg"}
                      alt={opportunity.chain}
                      className="mr-1 h-4 w-4 rounded-full"
                    />
                    <span>{opportunity.chain}</span>
                  </div>
                  <span>•</span>
                  <span>{opportunity.farmType}</span>
                  <span>•</span>
                  <Badge
                    variant="outline"
                    className={`${RISK_COLORS[opportunity.risk as keyof typeof RISK_COLORS]} text-white`}
                  >
                    {opportunity.risk} Risk
                  </Badge>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-500">{opportunity.apy.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">Current APY</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">${formatNumber(opportunity.tvl)}</div>
                <p className="text-xs text-muted-foreground">Total Value Locked</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{opportunity.rewards.join(", ")}</div>
                <p className="text-xs text-muted-foreground">Reward Tokens</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{opportunity.lockPeriod || "None"}</div>
                <p className="text-xs text-muted-foreground">Lock Period</p>
              </CardContent>
            </Card>
          </div>

          {/* Deposit Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="deposit-amount">Deposit Amount</Label>
                  {walletConnected && (
                    <span className="text-sm text-muted-foreground">
                      Balance: ${formatNumber(walletBalance)}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={!walletConnected}
                  />
                  <Button variant="outline" onClick={handleMaxClick} disabled={!walletConnected}>
                    Max
                  </Button>
                </div>
              </div>

              {depositAmount && Number.parseFloat(depositAmount) > 0 && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Daily Rewards:</span>
                    <span className="font-medium">
                      ${formatNumber((Number.parseFloat(depositAmount) * opportunity.apy) / 100 / 365)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Monthly Rewards:</span>
                    <span className="font-medium">
                      ${formatNumber((Number.parseFloat(depositAmount) * opportunity.apy) / 100 / 12)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Yearly Rewards:</span>
                    <span className="font-medium">
                      ${formatNumber((Number.parseFloat(depositAmount) * opportunity.apy) / 100)}
                    </span>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={handleDeposit} disabled={!walletConnected || !depositAmount}>
                {walletConnected ? "Deposit" : "Connect Wallet to Deposit"}
              </Button>
            </CardContent>
          </Card>

          {/* Risk Analysis */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Risk Analysis</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Risk assessment based on various factors including smart contract audits, protocol maturity, and
                        market conditions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Overall Risk</span>
                    <Badge variant="outline">{opportunity.risk}</Badge>
                  </div>
                  <Progress value={getRiskValue(opportunity.risk)} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Impermanent Loss Risk</span>
                    <Badge variant="outline">{opportunity.impermanentLossRisk || "Low"}</Badge>
                  </div>
                  <Progress
                    value={getImpermanentLossRiskValue(opportunity.impermanentLossRisk || "Low")}
                    className="h-2"
                  />
                </div>

                {opportunity.farmType === "Liquidity Pool" && (
                  <Button variant="link" className="p-0 h-auto" onClick={onOpenIlCalculator}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Impermanent Loss
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Collapsible open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                Advanced Settings
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAdvancedSettings ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Gas Price Strategy</Label>
                    <div className="flex space-x-2">
                      {Object.keys(GAS_OPTIONS).map((option) => (
                        <Button
                          key={option}
                          variant={gasOption === option ? "default" : "outline"}
                          onClick={() => onGasOptionChange(option)}
                          className="flex-1"
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Est. Gas Cost: ${gasData.cost.toFixed(2)} ({gasData.speed})
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-compound Rewards</Label>
                      <p className="text-xs text-muted-foreground">Automatically reinvest rewards to maximize yield</p>
                    </div>
                    <Switch checked={autocompoundEnabled} onCheckedChange={onAutocompoundChange} />
                  </div>

                  {autocompoundEnabled && (
                    <div className="space-y-2">
                      <Label>Auto-harvest Threshold ($)</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          value={[harvestThreshold]}
                          onValueChange={(value) => onHarvestThresholdChange(value[0])}
                          max={500}
                          step={10}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-16 text-right">${harvestThreshold}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Rewards will be automatically harvested and reinvested when they reach this value
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Additional Info */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Protocol Website:</span>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Visit <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Contract Address:</span>
                <Button variant="link" className="p-0 h-auto">
                  View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Audit Status:</span>
                <Badge variant="default">Audited</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
