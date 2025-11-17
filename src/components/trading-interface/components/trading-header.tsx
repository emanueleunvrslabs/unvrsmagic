"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"

// Mock data for the selectors
const mockExchanges = [
  { id: "binance", name: "Binance" },
  { id: "coinbase", name: "Coinbase Pro" },
  { id: "kraken", name: "Kraken" },
  { id: "bybit", name: "Bybit" },
]

// Account types will be fetched dynamically based on available accounts

interface TradingSettings {
  tradingView: boolean
  signals: boolean
  fullscreen: boolean
}

interface TradingHeaderProps {
  selectedExchange: string
  selectedAccount: string
  selectedPair: string
  settings: TradingSettings
  onExchangeChange: (value: string) => void
  onAccountChange: (value: string) => void
  onPairChange: (value: string) => void
  onSettingChange: (key: keyof TradingSettings, value: boolean) => void
}

export function TradingHeader({
  selectedExchange,
  selectedAccount,
  selectedPair,
  settings,
  onExchangeChange,
  onAccountChange,
  onPairChange,
  onSettingChange,
}: TradingHeaderProps) {
  const [connectedExchanges, setConnectedExchanges] = useState<Array<{ id: string; name: string }>>([])
  const [availableAccounts, setAvailableAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [tradingPairs, setTradingPairs] = useState<Array<{ symbol: string; name: string }>>([])
  const [isLoadingPairs, setIsLoadingPairs] = useState(false)
  const [pairSearchQuery, setPairSearchQuery] = useState("")

  // Fetch connected exchanges
  useEffect(() => {
    const fetchConnectedExchanges = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('exchange_keys')
        .select('exchange')
        .eq('user_id', user.id)

      if (!error && data) {
        const exchanges = data.map((item) => ({
          id: item.exchange.toLowerCase(),
          name: item.exchange.charAt(0).toUpperCase() + item.exchange.slice(1)
        }))
        setConnectedExchanges(exchanges)
      }
    }

    fetchConnectedExchanges()
  }, [])

  // Fetch available accounts from Bitget
  useEffect(() => {
    const fetchAvailableAccounts = async () => {
      // For Bitget, we have these account types
      const bitgetAccounts = [
        { id: "spot", name: "Spot Account" },
        { id: "futures", name: "Futures Account" },
      ]
      setAvailableAccounts(bitgetAccounts)
    }

    fetchAvailableAccounts()
  }, [])

  // Fetch trading pairs from Bitget
  useEffect(() => {
    const fetchTradingPairs = async () => {
      if (!selectedExchange) return
      
      setIsLoadingPairs(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-bitget-symbols`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            console.log('Trading pairs loaded:', result.data.length, 'pairs')
            console.log('Sample pairs:', result.data.slice(0, 5))
            // Sort to put BTC/USDT first
            const sortedPairs = result.data.sort((a: { symbol: string; name: string }, b: { symbol: string; name: string }) => {
              if (a.name === "BTC/USDT") return -1
              if (b.name === "BTC/USDT") return 1
              return a.name.localeCompare(b.name)
            })
            setTradingPairs(sortedPairs)
          }
        }
      } catch (error) {
        console.error('Error fetching trading pairs:', error)
      } finally {
        setIsLoadingPairs(false)
      }
    }

    fetchTradingPairs()
  }, [selectedExchange])

  const filteredTradingPairs = tradingPairs.filter(pair => {
    const searchLower = pairSearchQuery.toLowerCase()
    const nameLower = pair.name.toLowerCase()
    const symbolLower = pair.symbol.toLowerCase()
    const matches = nameLower.includes(searchLower) || symbolLower.includes(searchLower)
    return matches
  })

  console.log('Search query:', pairSearchQuery)
  console.log('Filtered pairs count:', filteredTradingPairs.length)
  if (pairSearchQuery && filteredTradingPairs.length > 0) {
    console.log('First 5 filtered:', filteredTradingPairs.slice(0, 5))
  }

  return (
    <>
      {/* Exchange Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exchange</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedExchange} onValueChange={onExchangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select exchange" />
              </SelectTrigger>
              <SelectContent>
                {connectedExchanges.length === 0 ? (
                  <SelectItem value="none" disabled>No exchanges connected</SelectItem>
                ) : (
                  connectedExchanges.map((exchange) => (
                    <SelectItem key={exchange.id} value={exchange.id}>
                      {exchange.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAccount} onValueChange={onAccountChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.length === 0 ? (
                  <SelectItem value="none" disabled>No accounts available</SelectItem>
                ) : (
                  availableAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trading Pair</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={selectedPair} onValueChange={onPairChange} disabled={isLoadingPairs}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPairs ? "Loading pairs..." : "Select pair"} />
              </SelectTrigger>
              <SelectContent>
                {filteredTradingPairs.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {isLoadingPairs ? "Loading..." : "No trading pairs available"}
                  </SelectItem>
                ) : (
                  filteredTradingPairs.map((pair) => (
                    <SelectItem key={pair.symbol.toLowerCase()} value={pair.symbol.toLowerCase()}>
                      {pair.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pairs..."
                value={pairSearchQuery}
                onChange={(e) => setPairSearchQuery(e.target.value)}
                className="pl-8"
                disabled={isLoadingPairs}
              />
            </div>

            {pairSearchQuery.trim() && (
              <div className="rounded-md border border-border bg-background">
                <ul className="max-h-64 overflow-auto">
                  {filteredTradingPairs.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">No pairs found</li>
                  ) : (
                    filteredTradingPairs.slice(0, 100).map((pair) => (
                      <li key={pair.symbol}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => {
                            onPairChange(pair.symbol.toLowerCase())
                            setPairSearchQuery("")
                          }}
                        >
                          {pair.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
