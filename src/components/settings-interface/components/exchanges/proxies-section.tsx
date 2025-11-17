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

interface ProxiesSectionProps {
  proxies?: any[]
  onProxiesChange?: (proxies: any[]) => void
}

const PROXIES = [
  { id: "webshare", name: "Webshare", placeholder: "Enter API Key", description: "Proxy service" },
]

// Validation schemas for each proxy
const proxyKeySchemas = {
  webshare: z.string().trim().min(10, {
    message: "Webshare API key must be at least 10 characters"
  })
}

export const ProxiesSection: React.FC<ProxiesSectionProps> = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    webshare: "",
  })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [connectedProxies, setConnectedProxies] = useState<Set<string>>(new Set())
  const [connectingProxy, setConnectingProxy] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load saved proxy keys on mount
  useEffect(() => {
    const loadProxyKeys = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('api_keys')
          .select('provider, api_key')
          .eq('user_id', user.id)
          .in('provider', ['webshare'])

        if (error) {
          console.error("Error loading proxy keys:", error)
          return
        }

        if (data && data.length > 0) {
          const loadedKeys: Record<string, string> = {}
          const connected = new Set<string>()

          data.forEach((item) => {
            loadedKeys[item.provider] = item.api_key
            connected.add(item.provider)
          })

          setApiKeys(prev => ({ ...prev, ...loadedKeys }))
          setConnectedProxies(connected)
        }
      } catch (error) {
        console.error("Error loading proxy keys:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProxyKeys()
  }, [])

  const toggleKeyVisibility = (proxyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(proxyId)) {
      newVisibleKeys.delete(proxyId)
    } else {
      newVisibleKeys.add(proxyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const handleKeyChange = (proxyId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [proxyId]: value }))
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[proxyId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[proxyId]
        return newErrors
      })
    }
  }

  const validateApiKey = (proxyId: string): boolean => {
    const schema = proxyKeySchemas[proxyId as keyof typeof proxyKeySchemas]
    if (!schema) return true

    try {
      schema.parse(apiKeys[proxyId])
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[proxyId]
        return newErrors
      })
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(prev => ({
          ...prev,
          [proxyId]: error.errors[0]?.message || "Invalid API key format"
        }))
      }
      return false
    }
  }

  const handleConnect = async (proxyId: string) => {
    // Validate the API key first
    if (!validateApiKey(proxyId)) {
      toast.error("Please fix validation errors")
      return
    }

    setConnectingProxy(proxyId)
    
    // Verify API key before saving
    try {
      const { data, error } = await supabase.functions.invoke('verify-api-key', {
        body: { 
          provider: proxyId,
          apiKey: apiKeys[proxyId]
        }
      })

      if (error || !data?.valid) {
        toast.error(data?.error || "Invalid API key")
        setConnectingProxy(null)
        return
      }
    } catch (error) {
      console.error("Error verifying API key:", error)
      toast.error("Failed to verify API key")
      setConnectingProxy(null)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      // Save the API key to database
      const { error: saveError } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          provider: proxyId,
          api_key: apiKeys[proxyId],
        }, {
          onConflict: 'user_id,provider'
        })

      if (saveError) {
        console.error("Error saving API key:", saveError)
        toast.error("Failed to save API key")
        return
      }

      setConnectedProxies(prev => new Set([...prev, proxyId]))
      const proxyName = PROXIES.find(p => p.id === proxyId)?.name
      toast.success(`${proxyName} connected successfully`)
    } catch (error) {
      console.error("Error connecting proxy:", error)
      toast.error("Failed to connect proxy")
    } finally {
      setConnectingProxy(null)
    }
  }

  const handleDisconnect = async (proxyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', proxyId)

      if (error) {
        console.error("Error disconnecting proxy:", error)
        toast.error("Failed to disconnect proxy")
        return
      }

      setConnectedProxies(prev => {
        const newSet = new Set(prev)
        newSet.delete(proxyId)
        return newSet
      })
      
      setApiKeys(prev => ({ ...prev, [proxyId]: "" }))
      
      const proxyName = PROXIES.find(p => p.id === proxyId)?.name
      toast.success(`${proxyName} disconnected`)
    } catch (error) {
      console.error("Error disconnecting proxy:", error)
      toast.error("Failed to disconnect proxy")
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proxy</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PROXIES.map((proxy) => (
              <TableRow key={proxy.id}>
                <TableCell className="font-medium">{proxy.name}</TableCell>
                <TableCell className="text-muted-foreground">{proxy.description}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type={visibleKeys.has(proxy.id) ? "text" : "password"}
                      placeholder={proxy.placeholder}
                      value={apiKeys[proxy.id]}
                      onChange={(e) => handleKeyChange(proxy.id, e.target.value)}
                      disabled={connectedProxies.has(proxy.id)}
                      className={validationErrors[proxy.id] ? "border-red-500" : ""}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleKeyVisibility(proxy.id)}
                      disabled={!apiKeys[proxy.id]}
                    >
                      {visibleKeys.has(proxy.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {validationErrors[proxy.id] && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors[proxy.id]}</p>
                  )}
                </TableCell>
                <TableCell>
                  {connectedProxies.has(proxy.id) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect(proxy.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConnect(proxy.id)}
                      disabled={connectingProxy === proxy.id || !apiKeys[proxy.id]}
                    >
                      {connectingProxy === proxy.id ? "Connecting..." : "Connect"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
