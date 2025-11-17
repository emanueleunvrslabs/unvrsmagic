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

interface AIAgentsSectionProps {
  apiKeys: ApiKey[]
  onApiKeysChange: (apiKeys: ApiKey[]) => void
}

const AI_AGENT_PROVIDERS = [
  { id: "nano", name: "Nano 🍌", placeholder: "Enter API key", description: "Nano AI model", requiresOwnerId: false },
  { id: "veo3", name: "Veo3", placeholder: "Enter API key", description: "Veo3 AI model", requiresOwnerId: false },
  { id: "gamma", name: "Gamma", placeholder: "Enter API key", description: "Gamma AI model", requiresOwnerId: false },
  { id: "claude", name: "Claude 4.5", placeholder: "sk-ant-...", description: "Anthropic Claude", requiresOwnerId: false },
  { id: "chatgpt", name: "ChatGPT", placeholder: "sk-...", description: "OpenAI ChatGPT", requiresOwnerId: false },
]

// Validation schemas for each provider
const apiKeySchemas = {
  nano: z.string().trim().min(20, {
    message: "Nano API key must be at least 20 characters"
  }),
  veo3: z.string().trim().min(20, {
    message: "Veo3 API key must be at least 20 characters"
  }),
  gamma: z.string().trim().min(20, {
    message: "Gamma API key must be at least 20 characters"
  }),
  claude: z.string().trim().regex(/^sk-ant-[A-Za-z0-9-_]{20,}$/, {
    message: "Claude API key must start with 'sk-ant-' followed by at least 20 characters"
  }),
  chatgpt: z.string().trim().regex(/^sk-[A-Za-z0-9-_]{20,}$/, {
    message: "ChatGPT API key must start with 'sk-' followed by at least 20 characters"
  }),
}

export const AIAgentsSection: React.FC<AIAgentsSectionProps> = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    nano: "",
    veo3: "",
    gamma: "",
    claude: "",
    chatgpt: "",
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

        // Load both AI agent keys and the underlying provider keys
        const { data, error } = await supabase
          .from('api_keys')
          .select('provider, api_key')
          .eq('user_id', user.id)
          .in('provider', ['nano', 'veo3', 'gamma', 'claude', 'chatgpt', 'fal', 'openai', 'anthropic'])

        if (error) {
          console.error("Error loading API keys:", error)
          return
        }

        if (data && data.length > 0) {
          const loadedKeys: Record<string, string> = {}
          const connected = new Set<string>()

          // Check which underlying providers are connected
          const hasFal = data.some(item => item.provider === 'fal')
          const hasGamma = data.some(item => item.provider === 'gamma')
          const hasAnthropic = data.some(item => item.provider === 'anthropic')
          const hasOpenAI = data.some(item => item.provider === 'openai')

          data.forEach((item) => {
            loadedKeys[item.provider] = item.api_key
            connected.add(item.provider)
          })

          // Auto-connect agents based on underlying providers
          if (hasFal) {
            connected.add('nano')
            connected.add('veo3')
          }
          if (hasGamma) {
            connected.add('gamma')
          }
          if (hasAnthropic) {
            connected.add('claude')
          }
          if (hasOpenAI) {
            connected.add('chatgpt')
          }

          setApiKeys(prev => ({ ...prev, ...loadedKeys }))
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
    const schema = apiKeySchemas[providerId as keyof typeof apiKeySchemas]
    if (!schema) return true

    try {
      schema.parse(apiKeys[providerId])
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[providerId]
        return newErrors
      })
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(prev => ({
          ...prev,
          [providerId]: error.errors[0]?.message || "Invalid API key format"
        }))
      }
      return false
    }
  }

  const handleConnect = async (providerId: string) => {
    // Prevent direct connection for agents that depend on other providers
    if (providerId === 'nano' || providerId === 'veo3') {
      toast.error("Please connect Fal API in AI Model API section to use this agent")
      return
    }
    if (providerId === 'gamma') {
      toast.error("Please connect Gamma API in AI Model API section to use this agent")
      return
    }
    if (providerId === 'claude') {
      toast.error("Please connect Anthropic API in AI Model API section to use this agent")
      return
    }
    if (providerId === 'chatgpt') {
      toast.error("Please connect OpenAI API in AI Model API section to use this agent")
      return
    }

    // Validate the API key first
    if (!validateApiKey(providerId)) {
      toast.error("Please fix validation errors")
      return
    }

    setConnectingProvider(providerId)
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
          provider: providerId,
          api_key: apiKeys[providerId],
        }, {
          onConflict: 'user_id,provider'
        })

      if (saveError) {
        console.error("Error saving API key:", saveError)
        toast.error("Failed to save API key")
        return
      }

      setConnectedProviders(prev => new Set([...prev, providerId]))
      const providerName = AI_AGENT_PROVIDERS.find(p => p.id === providerId)?.name
      toast.success(`${providerName} connected successfully`)
    } catch (error) {
      console.error("Error connecting provider:", error)
      toast.error("Failed to connect provider")
    } finally {
      setConnectingProvider(null)
    }
  }

  const handleDisconnect = async (providerId: string) => {
    // Prevent direct disconnection for agents that depend on other providers
    if (providerId === 'nano' || providerId === 'veo3') {
      toast.error("Please disconnect Fal API in AI Model API section to disconnect this agent")
      return
    }
    if (providerId === 'gamma') {
      toast.error("Please disconnect Gamma API in AI Model API section to disconnect this agent")
      return
    }
    if (providerId === 'claude') {
      toast.error("Please disconnect Anthropic API in AI Model API section to disconnect this agent")
      return
    }
    if (providerId === 'chatgpt') {
      toast.error("Please disconnect OpenAI API in AI Model API section to disconnect this agent")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', providerId)

      if (error) {
        console.error("Error disconnecting provider:", error)
        toast.error("Failed to disconnect provider")
        return
      }

      setConnectedProviders(prev => {
        const newSet = new Set(prev)
        newSet.delete(providerId)
        return newSet
      })
      
      setApiKeys(prev => ({ ...prev, [providerId]: "" }))
      
      const providerName = AI_AGENT_PROVIDERS.find(p => p.id === providerId)?.name
      toast.success(`${providerName} disconnected`)
    } catch (error) {
      console.error("Error disconnecting provider:", error)
      toast.error("Failed to disconnect provider")
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">AI Agent API Keys</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your AI agent provider accounts to enable AI-powered features
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {AI_AGENT_PROVIDERS.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell className="text-muted-foreground">{provider.description}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 max-w-xs">
                    <div className="flex-1">
                      <Input
                        type={visibleKeys.has(provider.id) ? "text" : "password"}
                        value={apiKeys[provider.id]}
                        onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                        placeholder={
                          (provider.id === 'nano' || provider.id === 'veo3') && connectedProviders.has(provider.id)
                            ? "Powered by Fal"
                            : provider.id === 'gamma' && connectedProviders.has(provider.id)
                            ? "Powered by Gamma"
                            : provider.id === 'claude' && connectedProviders.has(provider.id)
                            ? "Powered by Anthropic"
                            : provider.id === 'chatgpt' && connectedProviders.has(provider.id)
                            ? "Powered by OpenAI"
                            : provider.placeholder
                        }
                        disabled={connectedProviders.has(provider.id)}
                        className={validationErrors[provider.id] ? "border-red-500" : ""}
                      />
                      {validationErrors[provider.id] && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors[provider.id]}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleKeyVisibility(provider.id)}
                      disabled={!apiKeys[provider.id]}
                    >
                      {visibleKeys.has(provider.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {connectedProviders.has(provider.id) ? (
                    <span className="text-green-600 text-sm font-medium">Connected</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not connected</span>
                  )}
                </TableCell>
                <TableCell>
                  {connectedProviders.has(provider.id) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect(provider.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(provider.id)}
                      disabled={!apiKeys[provider.id] || connectingProvider === provider.id}
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
    </div>
  )
}
