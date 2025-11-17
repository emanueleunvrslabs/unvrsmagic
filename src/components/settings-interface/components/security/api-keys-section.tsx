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
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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

  const validateApiKeys = (): boolean => {
    const errors: Record<string, string> = {}
    let hasError = false

    AI_PROVIDERS.forEach(provider => {
      const key = apiKeys[provider.id]
      
      // Only validate if key is not empty
      if (key && key.trim() !== "") {
        const schema = apiKeySchemas[provider.id as keyof typeof apiKeySchemas]
        const result = schema.safeParse(key)
        
        if (!result.success) {
          errors[provider.id] = result.error.errors[0].message
          hasError = true
        }
      }
    })

    setValidationErrors(errors)
    return !hasError
  }

  const handleSaveKeys = async () => {
    // Validate all API keys before saving
    if (!validateApiKeys()) {
      toast.error("Please fix validation errors before saving")
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        setIsSaving(false)
        return
      }

      // Only save non-empty keys
      const keysToSave = Object.entries(apiKeys).filter(([_, value]) => value.trim() !== "")
      
      if (keysToSave.length === 0) {
        toast.error("Please enter at least one API key")
        setIsSaving(false)
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
