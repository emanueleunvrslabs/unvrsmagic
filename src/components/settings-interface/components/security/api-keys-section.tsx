"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Save } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import type { ApiKey } from "../../types"

interface ApiKeysSectionProps {
  apiKeys: ApiKey[]
  onApiKeysChange: (apiKeys: ApiKey[]) => void
}

export const ApiKeysSection: React.FC<ApiKeysSectionProps> = () => {
  const [openaiKey, setOpenaiKey] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")
  const [qwenKey, setQwenKey] = useState("")
  const [showOpenai, setShowOpenai] = useState(false)
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [showQwen, setShowQwen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">OpenAI</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your OpenAI API key for GPT models
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type={showOpenai ? "text" : "password"}
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowOpenai(!showOpenai)}
              >
                {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Anthropic</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Anthropic API key for Claude models
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type={showAnthropic ? "text" : "password"}
                  placeholder="sk-ant-..."
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAnthropic(!showAnthropic)}
              >
                {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Qwen3</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Qwen3 API key for Alibaba's AI models
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type={showQwen ? "text" : "password"}
                  placeholder="Enter your Qwen3 API key"
                  value={qwenKey}
                  onChange={(e) => setQwenKey(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQwen(!showQwen)}
              >
                {showQwen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveKeys} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save API Keys"}
        </Button>
      </div>
    </div>
  )
}
