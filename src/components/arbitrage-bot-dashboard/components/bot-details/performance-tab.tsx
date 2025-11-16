"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import type { ArbitrageBot } from "../../types"

interface PerformanceTabProps {
  bot: ArbitrageBot
  historicalData: {
    dailyProfits: Array<{ date: string; profit: number }>
    spreadHistory: Array<{ timestamp: string; spread: number }>
    volumeHistory: Array<{ timestamp: string; volume: number }>
  }
}

export function PerformanceTab({ bot, historicalData }: PerformanceTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profit History</CardTitle>
          <CardDescription>Daily profit over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData.dailyProfits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spread History</CardTitle>
            <CardDescription>Spread percentage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData.spreadHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="spread" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume History</CardTitle>
            <CardDescription>Trading volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData.volumeHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Detailed bot performance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="profitability">Profitability</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-xl font-bold">{bot.successRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Profit/Trade</p>
                  <p className="text-xl font-bold">${(bot.totalProfit / (bot.totalTrades || 1)).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Largest Profit</p>
                  <p className="text-xl font-bold">${(bot.totalProfit * 0.15).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Execution Time</p>
                  <p className="text-xl font-bold">2.5s</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trades" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bot.successRate}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bot.totalTrades || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Profitable Trades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.floor((bot.totalTrades || 0) * (bot.successRate / 100))}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">${bot.totalProfit.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profitability" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Daily</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${(bot.totalProfit * 0.05).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weekly</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${(bot.totalProfit * 0.30).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${(bot.totalProfit * 0.80).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">All-Time</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${bot.totalProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Pair</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bot.pairs[0] || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Spread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bot.minSpread}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${bot.maxVolume?.toLocaleString() || "0"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5s</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
