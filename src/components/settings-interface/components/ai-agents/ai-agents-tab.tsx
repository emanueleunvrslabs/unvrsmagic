"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AIAgentsSection } from "./ai-agents-section"
import type { ApiKey } from "../../types"

interface AIAgentsTabProps {
  apiKeys: ApiKey[]
  onApiKeysChange: (apiKeys: ApiKey[]) => void
}

export const AIAgentsTab: React.FC<AIAgentsTabProps> = ({ apiKeys, onApiKeysChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Agents API</h2>
        <p className="text-muted-foreground">Connect and manage your AI agent providers</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <AIAgentsSection apiKeys={apiKeys} onApiKeysChange={onApiKeysChange} />
        </CardContent>
      </Card>
    </div>
  )
}
