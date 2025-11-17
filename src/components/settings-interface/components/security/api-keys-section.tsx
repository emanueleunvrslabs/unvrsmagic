"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  { id: "openai", name: "OpenAI", placeholder: "sk-...", description: "GPT models" },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-...", description: "Claude models" },
  { id: "qwen", name: "Qwen3", placeholder: "Enter API key", description: "Alibaba AI models" },
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
  })
}

export const ApiKeysSection: React.FC<ApiKeysSectionProps> = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: "",
    anthropic: "",
    qwen: "",
  })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set())
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)

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

    setConnectingProvider(providerId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      // TODO: In a real implementation, verify the API key with the provider's API
      // For now, simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000))

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

  const handleDisconnect = (providerId: string) => {
    setConnectedProviders(prev => {
      const newSet = new Set(prev)
      newSet.delete(providerId)
      return newSet
    })
    
    setApiKeys(prev => ({ ...prev, [providerId]: "" }))
    
    const providerName = AI_PROVIDERS.find(p => p.id === providerId)?.name
    toast.success(`${providerName} disconnected`)
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {AI_PROVIDERS.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 max-w-md">
                      <Input
                        type={visibleKeys.has(provider.id) ? "text" : "password"}
                        placeholder={provider.placeholder}
                        value={apiKeys[provider.id]}
                        onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                        className={`flex-1 ${validationErrors[provider.id] ? 'border-destructive' : ''}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(provider.id)}
                      >
                        {visibleKeys.has(provider.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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
                  <Badge variant={connectedProviders.has(provider.id) ? "default" : "secondary"}>
                    {connectedProviders.has(provider.id) ? "Connected" : "Not connected"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {connectedProviders.has(provider.id) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(provider.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(provider.id)}
                      disabled={connectingProvider === provider.id || !apiKeys[provider.id]}
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
