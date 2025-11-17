"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface NKMTAgentPromptModalProps {
  isOpen: boolean
  onClose: () => void
  agentName: string
  agentId: string
}

export const NKMTAgentPromptModal: React.FC<NKMTAgentPromptModalProps> = ({
  isOpen,
  onClose,
  agentName,
  agentId,
}) => {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPrompt()
    }
  }, [isOpen, agentId])

  const loadPrompt = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('agent_prompts')
        .select('prompt')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .maybeSingle()

      if (error) {
        console.error("Error loading prompt:", error)
        return
      }

      if (data) {
        setPrompt(data.prompt || "")
      }
    } catch (error) {
      console.error("Error loading prompt:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      const { error } = await supabase
        .from('agent_prompts')
        .upsert({
          user_id: user.id,
          agent_id: agentId,
          prompt: prompt.trim(),
        })

      if (error) {
        console.error("Error saving prompt:", error)
        toast.error("Failed to save prompt")
        return
      }

      toast.success("Prompt saved successfully")
      onClose()
    } catch (error) {
      console.error("Error saving prompt:", error)
      toast.error("Failed to save prompt")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configure Prompt - {agentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Loading prompt...</div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">System Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Enter the system prompt for ${agentName}...`}
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Define the behavior and instructions for this AI agent
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Prompt"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
