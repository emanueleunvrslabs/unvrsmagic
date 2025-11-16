"use client"

import { useState } from "react"
import { TrendingUp, DollarSign, Percent, BarChart3, Activity } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "../../utils"
import type { PortfolioAllocation, UserFarm } from "../../types"

interface DetailedAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  portfolioData: PortfolioAllocation[]
  totalPortfolioValue: number
  totalRewards: number
  userFarms: UserFarm[]
  averageApy: number
  estimatedMonthlyYield: number
}

export function DetailedAnalyticsModal({
  isOpen,
  onClose,
  portfolioData,
  totalPortfolioValue,
  totalRewards,
  userFarms,
  averageApy,
  estimatedMonthlyYield,
}: DetailedAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock historical data for charts
  const performanceData = [
    { date: "Jan", value: totalPortfolioValue * 0.7, rewards: totalRewards * 0.1 },
    { date: "Feb", value: totalPortfolioValue * 0.75, rewards: totalRewards * 0.2 },
    { date: "Mar", value: totalPortfolioValue * 0.8, rewards: totalRewards * 0.35 },
    { date: "Apr", value: totalPortfolioValue * 0.85, rewards: totalRewards * 0.5 },
    { date: "May", value: totalPortfolioValue * 0.9, rewards: totalRewards * 0.7 },
    { date: "Jun", value: totalPortfolioValue * 0.95, rewards: totalRewards * 0.85 },
    { date: "Jul", value: totalPortfolioValue, rewards: totalRewards },
  ]

  const apyTrendsData = [
    { date: "Jan", apy: averageApy * 0.8 },
    { date: "Feb", apy: averageApy * 0.9 },
    { date: "Mar", apy: averageApy * 1.1 },
    { date: "Apr", apy: averageApy * 0.95 },
    { date: "May", apy: averageApy * 1.05 },
    { date: "Jun", apy: averageApy * 0.98 },
    { date: "Jul", apy: averageApy },
  ]

  const riskMetrics = [
    { name: "Low Risk", value: 35, color: "#10b981" },
    { name: "Medium Risk", value: 45, color: "#f59e0b" },
    { name: "High Risk", value: 20, color: "#ef4444" },
  ]

  const totalReturn = ((totalPortfolioValue + totalRewards) / (totalPortfolioValue * 0.7) - 1) * 100
  const bestPerformingFarm = userFarms.reduce((best, farm) => (farm.apy > best.apy ? farm : best), userFarms[0])
  const worstPerformingFarm = userFarms.reduce((worst, farm) => (farm.apy < worst.apy ? farm : worst), userFarms[0])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Portfolio Analytics
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="farms">Farm Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalReturn.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">Since inception</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Yield</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(estimatedMonthlyYield)}</div>
                  <p className="text-xs text-muted-foreground">Estimated</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg APY</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageApy.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">Weighted average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userFarms.length}</div>
                  <p className="text-xs text-muted-foreground">Across protocols</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="rewards" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>APY Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={apyTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="apy" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Best Performer</CardTitle>
                </CardHeader>
                <CardContent>
                  {bestPerformingFarm && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{bestPerformingFarm.protocol}</span>
                        <Badge variant="default">{bestPerformingFarm.apy.toFixed(2)}% APY</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{bestPerformingFarm.asset}</div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span>Deposited:</span>
                        <span className="font-medium">{formatCurrency(bestPerformingFarm.deposited)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Earned:</span>
                        <span className="font-medium text-green-500">{formatCurrency(bestPerformingFarm.earned)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lowest Performer</CardTitle>
                </CardHeader>
                <CardContent>
                  {worstPerformingFarm && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{worstPerformingFarm.protocol}</span>
                        <Badge variant="secondary">{worstPerformingFarm.apy.toFixed(2)}% APY</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{worstPerformingFarm.asset}</div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span>Deposited:</span>
                        <span className="font-medium">{formatCurrency(worstPerformingFarm.deposited)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Earned:</span>
                        <span className="font-medium text-green-500">{formatCurrency(worstPerformingFarm.earned)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={riskMetrics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {riskMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Overall Risk Score</span>
                      <Badge variant="outline">Medium</Badge>
                    </div>
                    <Progress value={55} className="h-2" />
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Impermanent Loss Risk:</span>
                      <span className="font-medium">Moderate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Smart Contract Risk:</span>
                      <span className="font-medium">Low</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liquidity Risk:</span>
                      <span className="font-medium">Low</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="farms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Farms Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userFarms.map((farm) => (
                    <div key={farm.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={farm.logo || "/placeholder.svg"}
                            alt={farm.protocol}
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <div className="font-medium">{farm.protocol}</div>
                            <div className="text-sm text-muted-foreground">{farm.asset}</div>
                          </div>
                        </div>
                        <Badge variant="default">{farm.apy.toFixed(2)}% APY</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Deposited</div>
                          <div className="font-medium">{formatCurrency(farm.deposited)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Earned</div>
                          <div className="font-medium text-green-500">{formatCurrency(farm.earned)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Value</div>
                          <div className="font-medium">{formatCurrency(farm.deposited + farm.earned)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
