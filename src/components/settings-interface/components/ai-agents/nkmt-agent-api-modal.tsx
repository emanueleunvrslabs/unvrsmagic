"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"

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
  const [isVerifying, setIsVerifying] = useState(false)

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
  }

  const verifyAndSaveApiKeys = async () => {
    // Check if all required API keys are filled
    const missingKeys = externalApis.filter(api => !apiKeys[api.provider]?.trim())
    if (missingKeys.length > 0) {
      toast.error(`Please fill in all API keys`)
      return
    }

    setIsVerifying(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("User not authenticated")
        setIsVerifying(false)
        return
      }

      // Verify each API key
      for (const api of externalApis) {
        const apiKey = apiKeys[api.provider]
        
        const { data, error } = await supabase.functions.invoke('verify-api-key', {
          body: { 
            provider: api.provider,
            apiKey: apiKey
          }
        })

        if (error || !data?.valid) {
          toast.error(`${api.name} API key verification failed`)
          setIsVerifying(false)
          return
        }
      }

      // If all verifications passed, save to database
      for (const api of externalApis) {
        const { error: saveError } = await supabase
          .from('api_keys')
          .upsert({
            user_id: user.id,
            provider: api.provider,
            api_key: apiKeys[api.provider],
          }, {
            onConflict: 'user_id,provider'
          })

        if (saveError) {
          console.error(`Error saving ${api.name} API key:`, saveError)
          toast.error(`Failed to save ${api.name} API key`)
          setIsVerifying(false)
          return
        }
      }

      toast.success(`All API keys configured successfully for ${agentName}`)
      setApiKeys({})
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error verifying/saving API keys:", error)
      toast.error("Failed to configure API keys")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure API Keys - {agentName}</DialogTitle>
          <DialogDescription>
            Enter the API keys required for this agent to function properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {externalApis.map((api) => (
            <div key={api.provider} className="space-y-2">
              <Label htmlFor={api.provider}>{api.name}</Label>
              <div className="relative">
                <Input
                  id={api.provider}
                  type={visibleKeys.has(api.provider) ? "text" : "password"}
                  placeholder={api.placeholder}
                  value={apiKeys[api.provider] || ""}
                  onChange={(e) => handleKeyChange(api.provider, e.target.value)}
                  className="pr-10"
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
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isVerifying}>
            Cancel
          </Button>
          <Button onClick={verifyAndSaveApiKeys} disabled={isVerifying}>
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
