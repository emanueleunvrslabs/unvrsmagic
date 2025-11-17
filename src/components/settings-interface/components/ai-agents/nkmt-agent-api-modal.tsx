"use client"

import { useState } from "react"
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

      if (error || !data?.valid) {
        toast.error(`${apiName} API key verification failed`)
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
                  onClick={() => verifyAndSaveApiKey(api.provider, api.name)}
                  disabled={verifyingProviders.has(api.provider) || verifiedProviders.has(api.provider)}
                  size="default"
                  className="min-w-[100px]"
                >
                  {verifyingProviders.has(api.provider) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying
                    </>
                  ) : verifiedProviders.has(api.provider) ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Verified
                    </>
                  ) : (
                    "Verify"
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
