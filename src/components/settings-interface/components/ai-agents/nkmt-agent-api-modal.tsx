"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { Eye, EyeOff, Loader2, Check } from "lucide-react"

interface ExternalApi {
  name: string
  provider: string
  placeholder: string
}

interface NKMTAgentApiModalProps {
  isOpen: boolean
  onClose: () => void
  agentName: string
  agentId: string
  externalApis: ExternalApi[]
  onSuccess: () => void
}

export function NKMTAgentApiModal({
  isOpen,
  onClose,
  agentName,
  agentId,
  externalApis,
  onSuccess
}: NKMTAgentApiModalProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [verifyingProviders, setVerifyingProviders] = useState<Set<string>>(new Set())
  const [verifiedProviders, setVerifiedProviders] = useState<Set<string>>(new Set())

  // Load existing API keys when modal opens
  useEffect(() => {
    const loadApiKeys = async () => {
      if (!isOpen) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const providers = externalApis.map(api => api.provider)
        const { data, error } = await supabase
          .from('api_keys')
          .select('provider, api_key')
          .eq('user_id', user.id)
          .in('provider', providers)

        if (error) {
          console.error("Error loading API keys:", error)
          return
        }

        if (data && data.length > 0) {
          const loadedKeys: Record<string, string> = {}
          const verified = new Set<string>()

          data.forEach((item) => {
            loadedKeys[item.provider] = item.api_key
            verified.add(item.provider)
          })

          setApiKeys(loadedKeys)
          setVerifiedProviders(verified)
        }
      } catch (error) {
        console.error("Error loading API keys:", error)
      }
    }

    loadApiKeys()
  }, [isOpen, externalApis])

  const toggleKeyVisibility = (provider: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(provider)) {
        newSet.delete(provider)
      } else {
        newSet.add(provider)
      }
      return newSet
    })
  }

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }))
    // Reset verified status when user changes the key
    setVerifiedProviders(prev => {
      const newSet = new Set(prev)
      newSet.delete(provider)
      return newSet
    })
  }

  const verifyAndSaveApiKey = async (provider: string, apiName: string) => {
    const apiKey = apiKeys[provider]?.trim()
    
    if (!apiKey) {
      toast.error(`Please enter ${apiName} API key`)
      return
    }

    setVerifyingProviders(prev => new Set([...prev, provider]))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("User not authenticated")
        setVerifyingProviders(prev => {
          const newSet = new Set(prev)
          newSet.delete(provider)
          return newSet
        })
        return
      }

      // Verify the API key
      const { data, error } = await supabase.functions.invoke('verify-api-key', {
        body: { 
          provider: provider,
          apiKey: apiKey
        }
      })

      console.log('Verify response:', { data, error, provider, apiName })

      if (error) {
        console.error('Supabase function error:', error)
        toast.error(`${apiName} API key verification failed: ${error.message}`)
        setVerifyingProviders(prev => {
          const newSet = new Set(prev)
          newSet.delete(provider)
          return newSet
        })
        return
      }

      if (!data?.valid) {
        const errorMsg = data?.error || 'Unknown error'
        console.error('Validation failed:', errorMsg)
        toast.error(`${apiName} verification failed: ${errorMsg}`)
        setVerifyingProviders(prev => {
          const newSet = new Set(prev)
          newSet.delete(provider)
          return newSet
        })
        return
      }

      // If verification passed, save to database
      const { error: saveError } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          provider: provider,
          api_key: apiKey,
        }, {
          onConflict: 'user_id,provider'
        })

      if (saveError) {
        console.error(`Error saving ${apiName} API key:`, saveError)
        toast.error(`Failed to save ${apiName} API key`)
        setVerifyingProviders(prev => {
          const newSet = new Set(prev)
          newSet.delete(provider)
          return newSet
        })
        return
      }

      toast.success(`${apiName} API key verified and saved`)
      setVerifiedProviders(prev => new Set([...prev, provider]))
      setVerifyingProviders(prev => {
        const newSet = new Set(prev)
        newSet.delete(provider)
        return newSet
      })
      onSuccess()
    } catch (error) {
      console.error(`Error processing ${apiName} API key:`, error)
      toast.error(`Failed to process ${apiName} API key`)
      setVerifyingProviders(prev => {
        const newSet = new Set(prev)
        newSet.delete(provider)
        return newSet
      })
    }
  }

  const disconnectApiKey = async (provider: string, apiName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider)

      if (error) {
        console.error(`Error disconnecting ${apiName}:`, error)
        toast.error(`Failed to disconnect ${apiName}`)
        return
      }

      setVerifiedProviders(prev => {
        const newSet = new Set(prev)
        newSet.delete(provider)
        return newSet
      })
      setApiKeys(prev => ({ ...prev, [provider]: "" }))
      toast.success(`${apiName} disconnected`)
      onSuccess()
    } catch (error) {
      console.error(`Error disconnecting ${apiName}:`, error)
      toast.error(`Failed to disconnect ${apiName}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure API Keys - {agentName}</DialogTitle>
          <DialogDescription>
            Enter and verify the API keys required for this agent to function properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {externalApis.map((api) => (
            <div key={api.provider} className="space-y-2">
              <Label htmlFor={api.provider}>{api.name}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={api.provider}
                    type={visibleKeys.has(api.provider) ? "text" : "password"}
                    placeholder={api.placeholder}
                    value={apiKeys[api.provider] || ""}
                    onChange={(e) => handleKeyChange(api.provider, e.target.value)}
                    className="pr-10"
                    disabled={verifiedProviders.has(api.provider)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility(api.provider)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visibleKeys.has(api.provider) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button 
                  onClick={() => {
                    if (verifiedProviders.has(api.provider)) {
                      disconnectApiKey(api.provider, api.name)
                    } else {
                      verifyAndSaveApiKey(api.provider, api.name)
                    }
                  }}
                  disabled={verifyingProviders.has(api.provider)}
                  size="sm"
                  variant={verifiedProviders.has(api.provider) ? "destructive" : "default"}
                  className="min-w-[90px]"
                >
                  {verifyingProviders.has(api.provider) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting
                    </>
                  ) : verifiedProviders.has(api.provider) ? (
                    "Disconnect"
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
