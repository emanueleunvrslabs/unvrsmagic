"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import type { ApiKey } from "../../types"
import { z } from "zod"

interface ApiKeysSectionProps {
  apiKeys: ApiKey[]
  onApiKeysChange: (apiKeys: ApiKey[]) => void
}

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", placeholder: "sk-...", description: "GPT models", requiresOwnerId: false },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-...", description: "Claude models", requiresOwnerId: false },
  { id: "qwen", name: "Qwen3", placeholder: "Enter API key", description: "Alibaba AI models", requiresOwnerId: true },
  { id: "fal", name: "Fal", placeholder: "Enter API key", description: "Fal AI models", requiresOwnerId: false },
  { id: "firecrawl", name: "Firecrawl", placeholder: "fc-...", description: "Web scraping API", requiresOwnerId: false },
  { id: "heygen", name: "HeyGen", placeholder: "Enter API key", description: "AI Avatar & Streaming", requiresOwnerId: false },
  { id: "restream", name: "Restream", placeholder: "Enter API key", description: "Multi-platform streaming (WHIP)", requiresOwnerId: false },
  { id: "gamma", name: "Gamma", placeholder: "Enter API key", description: "Gamma AI models", requiresOwnerId: false },
  { id: "resend", name: "Resend", placeholder: "re_...", description: "Email API", requiresOwnerId: false },
  { id: "webshare", name: "Webshare", placeholder: "Enter API key", description: "Proxy service", requiresOwnerId: false },
]

// Validation schemas for each provider
const apiKeySchemas = {
  openai: z.string().trim().regex(/^sk-[A-Za-z0-9-_]{20,}$/, {
    message: "OpenAI API key must start with 'sk-' followed by at least 20 characters"
  }),
  anthropic: z.string().trim().regex(/^sk-ant-[A-Za-z0-9-_]{20,}$/, {
    message: "Anthropic API key must start with 'sk-ant-' followed by at least 20 characters"
  }),
  qwen: z.string().trim().min(20, {
    message: "Qwen3 API key must be at least 20 characters"
  }),
  fal: z.string().trim().min(20, {
    message: "Fal API key must be at least 20 characters"
  }),
  firecrawl: z.string().trim().regex(/^fc-[A-Za-z0-9-_]{20,}$/, {
    message: "Firecrawl API key must start with 'fc-' followed by at least 20 characters"
  }),
  heygen: z.string().trim().min(20, {
    message: "HeyGen API key must be at least 20 characters"
  }),
  restream: z.string().trim().min(10, {
    message: "Restream API key must be at least 10 characters"
  }),
  gamma: z.string().trim().min(20, {
    message: "Gamma API key must be at least 20 characters"
  }),
  resend: z.string().trim().regex(/^re_[A-Za-z0-9_]{20,}$/, {
    message: "Resend API key must start with 're_' followed by at least 20 characters"
  }),
  webshare: z.string().trim().min(20, {
    message: "Webshare API key must be at least 20 characters"
  })
}

export const ApiKeysSection: React.FC<ApiKeysSectionProps> = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: "",
    anthropic: "",
    qwen: "",
    fal: "",
    firecrawl: "",
    heygen: "",
    restream: "",
    gamma: "",
    resend: "",
    webshare: "",
  })
  const [ownerIds, setOwnerIds] = useState<Record<string, string>>({
    qwen: "",
  })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set())
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load saved API keys on mount
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('api_keys')
          .select('provider, api_key, owner_id')
          .eq('user_id', user.id)

        if (error) {
          console.error("Error loading API keys:", error)
          return
        }

        if (data && data.length > 0) {
          const loadedKeys: Record<string, string> = {}
          const loadedOwnerIds: Record<string, string> = {}
          const connected = new Set<string>()

          data.forEach((item) => {
            loadedKeys[item.provider] = item.api_key
            if (item.owner_id) {
              loadedOwnerIds[item.provider] = item.owner_id
            }
            connected.add(item.provider)
          })

          setApiKeys(prev => ({ ...prev, ...loadedKeys }))
          setOwnerIds(prev => ({ ...prev, ...loadedOwnerIds }))
          setConnectedProviders(connected)
        }
      } catch (error) {
        console.error("Error loading API keys:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadApiKeys()
  }, [])

  const toggleKeyVisibility = (providerId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(providerId)) {
      newVisibleKeys.delete(providerId)
    } else {
      newVisibleKeys.add(providerId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const handleKeyChange = (providerId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: value }))
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[providerId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[providerId]
        return newErrors
      })
    }
  }

  const validateApiKey = (providerId: string): boolean => {
    const key = apiKeys[providerId]
    
    if (!key || key.trim() === "") {
      setValidationErrors(prev => ({
        ...prev,
        [providerId]: "API key is required"
      }))
      return false
    }

    const schema = apiKeySchemas[providerId as keyof typeof apiKeySchemas]
    const result = schema.safeParse(key)
    
    if (!result.success) {
      setValidationErrors(prev => ({
        ...prev,
        [providerId]: result.error.errors[0].message
      }))
      return false
    }

    // Clear error if validation passes
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[providerId]
      return newErrors
    })
    
    return true
  }

  const handleConnect = async (providerId: string) => {
    // Validate the API key first
    if (!validateApiKey(providerId)) {
      toast.error("Please fix validation errors")
      return
    }

    // For Qwen3, validate owner_id as well
    if (providerId === "qwen" && !ownerIds.qwen?.trim()) {
      toast.error("Owner ID is required for Qwen3")
      return
    }

    setConnectingProvider(providerId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      // Verify the API key with the provider's API via edge function
      const { data, error } = await supabase.functions.invoke('verify-api-key', {
        body: {
          provider: providerId,
          apiKey: apiKeys[providerId],
          ownerId: providerId === "qwen" ? ownerIds.qwen : undefined
        }
      })

      if (error) {
        console.error("Error verifying API key:", error)
        toast.error("Failed to verify API key")
        return
      }

      if (!data?.valid) {
        toast.error(data?.error || "Invalid API key")
        return
      }

      // Save the verified API key to database
      const { error: saveError } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          provider: providerId,
          api_key: apiKeys[providerId],
          owner_id: providerId === "qwen" ? ownerIds.qwen : null
        }, {
          onConflict: 'user_id,provider'
        })

      if (saveError) {
        console.error("Error saving API key:", saveError)
        toast.error("Failed to save API key")
        return
      }

      // Mark as connected
      setConnectedProviders(prev => new Set(prev).add(providerId))
      
      const providerName = AI_PROVIDERS.find(p => p.id === providerId)?.name
      toast.success(`${providerName} connected successfully`)
    } catch (error) {
      console.error("Error connecting provider:", error)
      toast.error("Failed to connect provider")
    } finally {
      setConnectingProvider(null)
    }
  }

  const handleDisconnect = async (providerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      // Delete the API key from database
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', providerId)

      if (error) {
        console.error("Error deleting API key:", error)
        toast.error("Failed to disconnect provider")
        return
      }

      setConnectedProviders(prev => {
        const newSet = new Set(prev)
        newSet.delete(providerId)
        return newSet
      })
      
      setApiKeys(prev => ({ ...prev, [providerId]: "" }))
      if (providerId === "qwen") {
        setOwnerIds(prev => ({ ...prev, qwen: "" }))
      }
      
      const providerName = AI_PROVIDERS.find(p => p.id === providerId)?.name
      toast.success(`${providerName} disconnected`)
    } catch (error) {
      console.error("Error disconnecting provider:", error)
      toast.error("Failed to disconnect provider")
    }
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading API keys...
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-foreground/80">Provider</TableHead>
              <TableHead className="text-foreground/80">API Key</TableHead>
              <TableHead className="text-foreground/80">Description</TableHead>
              <TableHead className="text-foreground/80">Status</TableHead>
              <TableHead className="w-[120px] text-foreground/80">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {AI_PROVIDERS.map((provider) => (
              <TableRow key={provider.id} className="border-white/10">
                <TableCell className="font-medium text-foreground">{provider.name}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 max-w-md">
                      <Input
                        type={visibleKeys.has(provider.id) ? "text" : "password"}
                        placeholder={provider.placeholder}
                        value={apiKeys[provider.id]}
                        onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                        className={`flex-1 bg-white/5 border-white/10 ${validationErrors[provider.id] ? 'border-destructive' : ''}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(provider.id)}
                        className="hover:bg-transparent"
                      >
                        {visibleKeys.has(provider.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {provider.requiresOwnerId && (
                      <div className="flex items-center space-x-2 max-w-md">
                        <Input
                          type="text"
                          placeholder="Enter Owner ID"
                          value={ownerIds[provider.id] || ""}
                          onChange={(e) => setOwnerIds(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          className="flex-1 bg-white/5 border-white/10"
                        />
                        <div className="w-[40px]" />
                      </div>
                    )}
                    {validationErrors[provider.id] && (
                      <p className="text-sm text-destructive">
                        {validationErrors[provider.id]}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {provider.description}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    connectedProviders.has(provider.id) 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}>
                    {connectedProviders.has(provider.id) ? "Connected" : "Not connected"}
                  </span>
                </TableCell>
                <TableCell>
                  {connectedProviders.has(provider.id) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(provider.id)}
                      className="h-8 px-3 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/10"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(provider.id)}
                      disabled={connectingProvider === provider.id || !apiKeys[provider.id]}
                      className="h-8 px-3 text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/20"
                    >
                      {connectingProvider === provider.id ? "Connecting..." : "Connect"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  )
}
