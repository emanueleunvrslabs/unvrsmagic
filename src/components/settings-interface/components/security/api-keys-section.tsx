"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, EyeOff, Copy, Key, Check } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import type { ApiKey } from "../../types"
import { z } from "zod"

interface ApiKeysSectionProps {
  apiKeys: ApiKey[]
  onApiKeysChange: (apiKeys: ApiKey[]) => void
}

type ProviderType = 'standard' | 'revolut_business' | 'revolut_merchant'

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", placeholder: "sk-...", description: "GPT models", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-...", description: "Claude models", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "qwen", name: "Qwen3", placeholder: "Enter API key", description: "Alibaba AI models", requiresOwnerId: true, type: 'standard' as ProviderType },
  { id: "fal", name: "Fal", placeholder: "Enter API key", description: "Fal AI models", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "firecrawl", name: "Firecrawl", placeholder: "fc-...", description: "Web scraping API", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "heygen", name: "HeyGen", placeholder: "Enter API key", description: "AI Avatar & Streaming", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "restream", name: "Restream", placeholder: "Enter API key", description: "Multi-platform streaming (WHIP)", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "gamma", name: "Gamma", placeholder: "Enter API key", description: "Gamma AI models", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "resend", name: "Resend", placeholder: "re_...", description: "Email API", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "webshare", name: "Webshare", placeholder: "Enter API key", description: "Proxy service", requiresOwnerId: false, type: 'standard' as ProviderType },
  { id: "revolut_business", name: "Revolut Business", placeholder: "Enter Business API Key", description: "Transactions API", requiresOwnerId: false, type: 'revolut_business' as ProviderType },
  { id: "revolut_merchant", name: "Revolut Merchant", placeholder: "", description: "Payments API", requiresOwnerId: false, type: 'revolut_merchant' as ProviderType },
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
  }),
  revolut_business: z.string().trim().min(10, {
    message: "Revolut Business API key must be at least 10 characters"
  }),
  revolut_merchant: z.string().trim().min(10, {
    message: "Revolut Merchant API key must be at least 10 characters"
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
    revolut_business: "",
    revolut_merchant: "",
  })
  const [ownerIds, setOwnerIds] = useState<Record<string, string>>({
    qwen: "",
  })
  const [revolutMerchantPublicKey, setRevolutMerchantPublicKey] = useState("")
  const [revolutMerchantSecretKey, setRevolutMerchantSecretKey] = useState("")
  const [revolutWebhookConfigured, setRevolutWebhookConfigured] = useState(false)
  const [configuringWebhook, setConfiguringWebhook] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set())
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Revolut Business OAuth state
  const [revolutCertGenerating, setRevolutCertGenerating] = useState(false)
  const [revolutPublicKey, setRevolutPublicKey] = useState("")
  const [revolutRedirectUri, setRevolutRedirectUri] = useState("")
  const [revolutClientId, setRevolutClientId] = useState("")
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

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
            if (item.provider === 'revolut_merchant_public') {
              setRevolutMerchantPublicKey(item.api_key)
            } else if (item.provider === 'revolut_merchant_secret') {
              setRevolutMerchantSecretKey(item.api_key)
            } else if (item.provider === 'revolut_business') {
              // Load existing Revolut Business certificate data
              try {
                const certData = JSON.parse(item.api_key)
                if (certData.public_key) {
                  setRevolutPublicKey(certData.public_key)
                }
                if (certData.redirect_uri) {
                  setRevolutRedirectUri(certData.redirect_uri)
                }
                if (certData.client_id) {
                  setRevolutClientId(certData.client_id)
                }
              } catch (e) {
                console.error('Error parsing Revolut certificate data:', e)
              }
            } else {
              loadedKeys[item.provider] = item.api_key
            }
            if (item.owner_id) {
              loadedOwnerIds[item.provider] = item.owner_id
            }
          })

          // Check connection status for each provider
          data.forEach((item) => {
            if (item.provider === 'revolut_merchant_public' || item.provider === 'revolut_merchant_secret') {
              // Check if both merchant keys exist
              const hasMerchantPublic = data.some(d => d.provider === 'revolut_merchant_public')
              const hasMerchantSecret = data.some(d => d.provider === 'revolut_merchant_secret')
              const hasWebhookSecret = data.some(d => d.provider === 'revolut_webhook_secret')
              if (hasMerchantPublic && hasMerchantSecret) {
                connected.add('revolut_merchant')
              }
              if (hasWebhookSecret) {
                setRevolutWebhookConfigured(true)
              }
            } else if (item.provider !== 'revolut_merchant') {
              connected.add(item.provider)
            }
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
    if (!schema) return true
    
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
    const provider = AI_PROVIDERS.find(p => p.id === providerId)
    if (!provider) return

    // For Revolut Merchant, validate both keys
    if (provider.type === 'revolut_merchant') {
      if (!revolutMerchantPublicKey?.trim()) {
        toast.error("Merchant Public Key is required")
        return
      }
      if (!revolutMerchantSecretKey?.trim()) {
        toast.error("Merchant Secret Key is required")
        return
      }
    } else if (provider.type === 'revolut_business') {
      // For Revolut Business OAuth, validate certificate and client ID
      if (!revolutPublicKey) {
        toast.error("Please generate a certificate first")
        return
      }
      if (!revolutClientId?.trim()) {
        toast.error("Client ID is required")
        return
      }
    } else {
      // Validate the API key first
      if (!validateApiKey(providerId)) {
        toast.error("Please fix validation errors")
        return
      }
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

      // For Revolut Business OAuth flow
      if (provider.type === 'revolut_business') {
        // Save the client ID along with existing certificate data
        const { error: saveError } = await supabase
          .from('api_keys')
          .upsert({
            user_id: user.id,
            provider: 'revolut_business',
            api_key: JSON.stringify({
              public_key: revolutPublicKey,
              redirect_uri: revolutRedirectUri,
              client_id: revolutClientId
            }),
            owner_id: null
          }, {
            onConflict: 'user_id,provider'
          })

        if (saveError) {
          console.error("Error saving Revolut Business config:", saveError)
          toast.error("Failed to save configuration")
          setConnectingProvider(null)
          return
        }

        // Redirect to Revolut OAuth authorization page
        const state = user.id // Use user ID as state for callback
        const redirectUri = revolutRedirectUri
        const authUrl = `https://business.revolut.com/app-confirm?client_id=${revolutClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`
        
        toast.success("Redirecting to Revolut for authorization...")
        window.location.href = authUrl
        return
      }

      // For Revolut Merchant, verify with API then save both keys
      if (provider.type === 'revolut_merchant') {
        // Verify the Merchant Secret Key (the main authentication key)
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-api-key', {
          body: {
            provider: 'revolut_merchant',
            apiKey: revolutMerchantSecretKey
          }
        })

        if (verifyError) {
          console.error("Error verifying Revolut Merchant API key:", verifyError)
          toast.error("Failed to verify Revolut Merchant API key")
          return
        }

        if (!verifyData?.valid) {
          toast.error(verifyData?.error || "Invalid Revolut Merchant Secret Key")
          return
        }

        // Save Merchant Public Key
        const { error: saveError1 } = await supabase
          .from('api_keys')
          .upsert({
            user_id: user.id,
            provider: 'revolut_merchant_public',
            api_key: revolutMerchantPublicKey,
            owner_id: null
          }, {
            onConflict: 'user_id,provider'
          })

        if (saveError1) {
          console.error("Error saving Merchant Public Key:", saveError1)
          toast.error("Failed to save Merchant Public Key")
          return
        }

        // Save Merchant Secret Key
        const { error: saveError2 } = await supabase
          .from('api_keys')
          .upsert({
            user_id: user.id,
            provider: 'revolut_merchant_secret',
            api_key: revolutMerchantSecretKey,
            owner_id: null
          }, {
            onConflict: 'user_id,provider'
          })

        if (saveError2) {
          console.error("Error saving Merchant Secret Key:", saveError2)
          toast.error("Failed to save Merchant Secret Key")
          return
        }

        setConnectedProviders(prev => new Set(prev).add('revolut_merchant'))
        toast.success("Revolut Merchant connected successfully")
        setConnectingProvider(null)
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
      
      toast.success(`${provider.name} connected successfully`)
    } catch (error) {
      console.error("Error connecting provider:", error)
      toast.error("Failed to connect provider")
    } finally {
      setConnectingProvider(null)
    }
  }

  const handleSetupWebhook = async () => {
    setConfiguringWebhook(true)
    try {
      const { data, error } = await supabase.functions.invoke('register-revolut-webhook')
      
      if (error) {
        console.error("Error setting up webhook:", error)
        toast.error("Failed to setup webhooks")
        return
      }

      if (data?.success) {
        setRevolutWebhookConfigured(true)
        toast.success("Webhooks configured successfully")
      } else {
        toast.error(data?.error || "Failed to setup webhooks")
      }
    } catch (error) {
      console.error("Error setting up webhook:", error)
      toast.error("Failed to setup webhooks")
    } finally {
      setConfiguringWebhook(false)
    }
  }

  const handleDisconnect = async (providerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      const provider = AI_PROVIDERS.find(p => p.id === providerId)
      if (!provider) return

      // For Revolut Merchant, delete both keys
      if (provider.type === 'revolut_merchant') {
        const { error: error1 } = await supabase
          .from('api_keys')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'revolut_merchant_public')

        const { error: error2 } = await supabase
          .from('api_keys')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'revolut_merchant_secret')

        if (error1 || error2) {
          console.error("Error deleting Revolut Merchant keys:", error1 || error2)
          toast.error("Failed to disconnect Revolut Merchant")
          return
        }

        setConnectedProviders(prev => {
          const newSet = new Set(prev)
          newSet.delete('revolut_merchant')
          return newSet
        })
        
        setRevolutMerchantPublicKey("")
        setRevolutMerchantSecretKey("")
        toast.success("Revolut Merchant disconnected")
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
      
      toast.success(`${provider.name} disconnected`)
    } catch (error) {
      console.error("Error disconnecting provider:", error)
      toast.error("Failed to disconnect provider")
    }
  }

  const handleGenerateRevolutCert = async () => {
    setRevolutCertGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('revolut-generate-cert')
      
      if (error) {
        console.error("Error generating certificate:", error)
        toast.error("Failed to generate certificate")
        return
      }

      if (data?.publicKey) {
        setRevolutPublicKey(data.publicKey)
        setRevolutRedirectUri(data.redirectUri)
        toast.success("Certificate generated! Copy the public key to Revolut")
      }
    } catch (error) {
      console.error("Error generating certificate:", error)
      toast.error("Failed to generate certificate")
    } finally {
      setRevolutCertGenerating(false)
    }
  }

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(id)
    toast.success(`${label} copied!`)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const renderInputField = (provider: typeof AI_PROVIDERS[0]) => {
    if (provider.type === 'revolut_business') {
      return (
        <div className="space-y-3">
          {!revolutPublicKey ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateRevolutCert}
              disabled={revolutCertGenerating}
              className="h-8 px-3 text-xs bg-transparent text-blue-400 border border-blue-500/30 hover:bg-blue-500/10"
            >
              <Key className="h-3 w-3 mr-2" />
              {revolutCertGenerating ? "Generating..." : "Generate Certificate"}
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(revolutPublicKey, "cert", "X509 Certificate")}
                  className={`h-8 px-3 text-xs bg-transparent border ${
                    copiedItem === "cert" 
                      ? "text-green-400 border-green-500/50 bg-green-500/20" 
                      : "text-green-400 border-green-500/30 hover:bg-green-500/10"
                  }`}
                >
                  {copiedItem === "cert" ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                  {copiedItem === "cert" ? "Copied!" : "Copy X509 Certificate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(revolutRedirectUri, "uri", "Redirect URI")}
                  className={`h-8 px-3 text-xs bg-transparent border ${
                    copiedItem === "uri" 
                      ? "text-green-400 border-green-500/50 bg-green-500/20" 
                      : "text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                  }`}
                >
                  {copiedItem === "uri" ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                  {copiedItem === "uri" ? "Copied!" : "Copy Redirect URI"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Paste Client ID from Revolut"
                  value={revolutClientId}
                  onChange={(e) => setRevolutClientId(e.target.value)}
                  className="flex-1 max-w-xs h-8 text-xs bg-white/5 border-white/10"
                />
              </div>
              <span className="text-xs text-muted-foreground">Certificate generated ✓ - Paste Client ID to connect</span>
            </div>
          )}
        </div>
      )
    }

    if (provider.type === 'revolut_merchant') {
      return (
        <>
          <div className="flex items-center space-x-2 max-w-md">
            <Input
              type={visibleKeys.has(`${provider.id}_public`) ? "text" : "password"}
              placeholder="Merchant Public Key"
              value={revolutMerchantPublicKey}
              onChange={(e) => setRevolutMerchantPublicKey(e.target.value)}
              className="flex-1 bg-white/5 border-white/10"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleKeyVisibility(`${provider.id}_public`)}
              className="hover:bg-transparent"
            >
              {visibleKeys.has(`${provider.id}_public`) ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center space-x-2 max-w-md">
            <Input
              type={visibleKeys.has(`${provider.id}_secret`) ? "text" : "password"}
              placeholder="Merchant Secret Key"
              value={revolutMerchantSecretKey}
              onChange={(e) => setRevolutMerchantSecretKey(e.target.value)}
              className="flex-1 bg-white/5 border-white/10"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleKeyVisibility(`${provider.id}_secret`)}
              className="hover:bg-transparent"
            >
              {visibleKeys.has(`${provider.id}_secret`) ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {connectedProviders.has('revolut_merchant') && (
            <div className="flex items-center gap-2 mt-2">
              {revolutWebhookConfigured ? (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Webhooks configured
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetupWebhook}
                  disabled={configuringWebhook}
                  className="text-xs"
                >
                  {configuringWebhook ? "Configuring..." : "Setup Webhooks"}
                </Button>
              )}
            </div>
          )}
        </>
      )
    }

    return (
      <>
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
      </>
    )
  }

  const isConnectDisabled = (provider: typeof AI_PROVIDERS[0]) => {
    if (connectingProvider === provider.id) return true
    
    if (provider.type === 'revolut_merchant') {
      return !revolutMerchantPublicKey || !revolutMerchantSecretKey
    }
    
    if (provider.type === 'revolut_business') {
      // Revolut Business uses OAuth - needs certificate and client ID
      return !revolutPublicKey || !revolutClientId
    }
    
    return !apiKeys[provider.id]
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading API keys...
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10">
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
                    {renderInputField(provider)}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {provider.description}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center text-xs font-medium ${
                    connectedProviders.has(provider.id) 
                      ? "text-emerald-400" 
                      : "text-red-400"
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
                      className="h-8 px-3 text-xs bg-transparent text-red-400 border border-red-500/30 hover:bg-red-500/10"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleConnect(provider.id)}
                      disabled={isConnectDisabled(provider)}
                      className="h-8 px-3 text-xs bg-transparent text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 disabled:opacity-50"
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
