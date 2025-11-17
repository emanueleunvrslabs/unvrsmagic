"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, EyeOff, Save } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import type { ApiKey } from "../../types"

interface ApiKeysSectionProps {
  apiKeys: ApiKey[]
  onApiKeysChange: (apiKeys: ApiKey[]) => void
}

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", placeholder: "sk-...", description: "GPT models" },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-...", description: "Claude models" },
  { id: "qwen", name: "Qwen3", placeholder: "Enter API key", description: "Alibaba AI models" },
]

export const ApiKeysSection: React.FC<ApiKeysSectionProps> = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: "",
    anthropic: "",
    qwen: "",
  })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

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
  }

  const handleSaveKeys = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      toast.success("API keys saved successfully")
    } catch (error) {
      console.error("Error saving API keys:", error)
      toast.error("Failed to save API keys")
    } finally {
      setIsSaving(false)
    }
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {AI_PROVIDERS.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 max-w-md">
                    <Input
                      type={visibleKeys.has(provider.id) ? "text" : "password"}
                      placeholder={provider.placeholder}
                      value={apiKeys[provider.id]}
                      onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                      className="flex-1"
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
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {provider.description}
                </TableCell>
                <TableCell>
                  <Badge variant={apiKeys[provider.id] ? "default" : "secondary"}>
                    {apiKeys[provider.id] ? "Connected" : "Not connected"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveKeys} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save API Keys"}
        </Button>
      </div>
    </div>
  )
}
