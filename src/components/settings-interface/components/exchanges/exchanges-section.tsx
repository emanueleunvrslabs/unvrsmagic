"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { z } from "zod"

interface ExchangesSectionProps {
  exchanges: any[]
  onExchangesChange: (exchanges: any[]) => void
}

const EXCHANGES = [
  { id: "binance", name: "Binance", placeholder: "Enter API Key", description: "Spot & Futures trading", requiresSecret: true },
  { id: "coinbase", name: "Coinbase", placeholder: "Enter API Key", description: "Crypto exchange", requiresSecret: true },
  { id: "kraken", name: "Kraken", placeholder: "Enter API Key", description: "Crypto trading platform", requiresSecret: true },
  { id: "bybit", name: "Bybit", placeholder: "Enter API Key", description: "Derivatives trading", requiresSecret: true },
  { id: "bitget", name: "Bitget", placeholder: "Enter API Key", description: "Crypto derivatives exchange", requiresSecret: true },
]

// Validation schemas for each exchange
const exchangeKeySchemas = {
  binance: z.string().trim().min(20, {
    message: "Binance API key must be at least 20 characters"
  }),
  coinbase: z.string().trim().min(20, {
    message: "Coinbase API key must be at least 20 characters"
  }),
  kraken: z.string().trim().min(20, {
    message: "Kraken API key must be at least 20 characters"
  }),
  bybit: z.string().trim().min(20, {
    message: "Bybit API key must be at least 20 characters"
  }),
  bitget: z.string().trim().min(20, {
    message: "Bitget API key must be at least 20 characters"
  })
}

export const ExchangesSection: React.FC<ExchangesSectionProps> = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    binance: "",
    coinbase: "",
    kraken: "",
    bybit: "",
    bitget: "",
  })
  const [apiSecrets, setApiSecrets] = useState<Record<string, string>>({
    binance: "",
    coinbase: "",
    kraken: "",
    bybit: "",
    bitget: "",
  })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [connectedExchanges, setConnectedExchanges] = useState<Set<string>>(new Set())
  const [connectingExchange, setConnectingExchange] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load saved exchange keys on mount
  useEffect(() => {
    const loadExchangeKeys = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('exchange_keys')
          .select('exchange, api_key, api_secret')
          .eq('user_id', user.id)

        if (error) {
          console.error("Error loading exchange keys:", error)
          return
        }

        if (data && data.length > 0) {
          const loadedKeys: Record<string, string> = {}
          const loadedSecrets: Record<string, string> = {}
          const connected = new Set<string>()

          data.forEach((item) => {
            loadedKeys[item.exchange] = item.api_key
            if (item.api_secret) {
              loadedSecrets[item.exchange] = item.api_secret
            }
            connected.add(item.exchange)
          })

          setApiKeys(prev => ({ ...prev, ...loadedKeys }))
          setApiSecrets(prev => ({ ...prev, ...loadedSecrets }))
          setConnectedExchanges(connected)
        }
      } catch (error) {
        console.error("Error loading exchange keys:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadExchangeKeys()
  }, [])

  const toggleKeyVisibility = (exchangeId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(exchangeId)) {
      newVisibleKeys.delete(exchangeId)
    } else {
      newVisibleKeys.add(exchangeId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const toggleSecretVisibility = (exchangeId: string) => {
    const newVisibleSecrets = new Set(visibleSecrets)
    if (newVisibleSecrets.has(exchangeId)) {
      newVisibleSecrets.delete(exchangeId)
    } else {
      newVisibleSecrets.add(exchangeId)
    }
    setVisibleSecrets(newVisibleSecrets)
  }

  const handleKeyChange = (exchangeId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [exchangeId]: value }))
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[exchangeId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[exchangeId]
        return newErrors
      })
    }
  }

  const handleSecretChange = (exchangeId: string, value: string) => {
    setApiSecrets(prev => ({ ...prev, [exchangeId]: value }))
  }

  const validateApiKey = (exchangeId: string): boolean => {
    const key = apiKeys[exchangeId]
    
    if (!key || key.trim() === "") {
      setValidationErrors(prev => ({
        ...prev,
        [exchangeId]: "API key is required"
      }))
      return false
    }

    const schema = exchangeKeySchemas[exchangeId as keyof typeof exchangeKeySchemas]
    const result = schema.safeParse(key)
    
    if (!result.success) {
      setValidationErrors(prev => ({
        ...prev,
        [exchangeId]: result.error.errors[0].message
      }))
      return false
    }

    // Clear error if validation passes
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[exchangeId]
      return newErrors
    })
    
    return true
  }

  const handleConnect = async (exchangeId: string) => {
    // Validate the API key first
    if (!validateApiKey(exchangeId)) {
      toast.error("Please fix validation errors")
      return
    }

    // Check if secret is required and provided
    const exchange = EXCHANGES.find(e => e.id === exchangeId)
    if (exchange?.requiresSecret && !apiSecrets[exchangeId]?.trim()) {
      toast.error("API Secret is required for this exchange")
      return
    }

    setConnectingExchange(exchangeId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      // Verify the exchange credentials using edge function
      toast.loading("Verifying exchange credentials...")
      
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-exchange-key', {
        body: {
          exchange: exchangeId,
          apiKey: apiKeys[exchangeId],
          apiSecret: apiSecrets[exchangeId]
        }
      })

      if (verifyError) {
        console.error("Verification error:", verifyError)
        toast.error("Failed to verify exchange credentials")
        return
      }

      if (!verifyData?.isValid) {
        toast.error(verifyData?.error || "Invalid exchange credentials")
        return
      }

      toast.dismiss()
      toast.loading("Saving exchange credentials...")

      // Save the exchange credentials to database
      const { error: saveError } = await supabase
        .from('exchange_keys')
        .upsert({
          user_id: user.id,
          exchange: exchangeId,
          api_key: apiKeys[exchangeId],
          api_secret: apiSecrets[exchangeId] || null
        }, {
          onConflict: 'user_id,exchange'
        })

      if (saveError) {
        console.error("Error saving exchange credentials:", saveError)
        toast.error("Failed to save exchange credentials")
        return
      }

      // Mark as connected
      setConnectedExchanges(prev => new Set(prev).add(exchangeId))
      
      toast.dismiss()
      const exchangeName = EXCHANGES.find(e => e.id === exchangeId)?.name
      toast.success(`${exchangeName} connected successfully`)
    } catch (error) {
      console.error("Error connecting exchange:", error)
      toast.error("Failed to connect exchange")
    } finally {
      setConnectingExchange(null)
    }
  }

  const handleDisconnect = async (exchangeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      // Delete the exchange credentials from database
      const { error } = await supabase
        .from('exchange_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('exchange', exchangeId)

      if (error) {
        console.error("Error deleting exchange credentials:", error)
        toast.error("Failed to disconnect exchange")
        return
      }

      setConnectedExchanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(exchangeId)
        return newSet
      })
      
      setApiKeys(prev => ({ ...prev, [exchangeId]: "" }))
      setApiSecrets(prev => ({ ...prev, [exchangeId]: "" }))
      
      const exchangeName = EXCHANGES.find(e => e.id === exchangeId)?.name
      toast.success(`${exchangeName} disconnected`)
    } catch (error) {
      console.error("Error disconnecting exchange:", error)
      toast.error("Failed to disconnect exchange")
    }
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading exchange connections...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exchange</TableHead>
              <TableHead>Credentials</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EXCHANGES.map((exchange) => (
              <TableRow key={exchange.id}>
                <TableCell className="font-medium">{exchange.name}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 max-w-md">
                      <Input
                        type={visibleKeys.has(exchange.id) ? "text" : "password"}
                        placeholder={exchange.placeholder}
                        value={apiKeys[exchange.id]}
                        onChange={(e) => handleKeyChange(exchange.id, e.target.value)}
                        className={`flex-1 ${validationErrors[exchange.id] ? 'border-destructive' : ''}`}
                        disabled={connectedExchanges.has(exchange.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(exchange.id)}
                      >
                        {visibleKeys.has(exchange.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {exchange.requiresSecret && (
                      <div className="flex items-center space-x-2 max-w-md">
                        <Input
                          type={visibleSecrets.has(exchange.id) ? "text" : "password"}
                          placeholder="Enter API Secret"
                          value={apiSecrets[exchange.id] || ""}
                          onChange={(e) => handleSecretChange(exchange.id, e.target.value)}
                          className="flex-1"
                          disabled={connectedExchanges.has(exchange.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(exchange.id)}
                        >
                          {visibleSecrets.has(exchange.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    {validationErrors[exchange.id] && (
                      <p className="text-sm text-destructive">
                        {validationErrors[exchange.id]}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {exchange.description}
                </TableCell>
                <TableCell>
                  {connectedExchanges.has(exchange.id) ? (
                    <span className="text-green-600 dark:text-green-400">Connected</span>
                  ) : (
                    <span className="text-muted-foreground">Not connected</span>
                  )}
                </TableCell>
                <TableCell>
                  {connectedExchanges.has(exchange.id) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect(exchange.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConnect(exchange.id)}
                      disabled={connectingExchange === exchange.id}
                    >
                      {connectingExchange === exchange.id ? "Connecting..." : "Connect"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
