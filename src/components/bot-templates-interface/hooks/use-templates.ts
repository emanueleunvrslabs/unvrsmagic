"use client"

import { useState, useCallback } from "react"
import type { BotTemplate } from "../types"
import { mockTemplates } from "../data"

export const useTemplates = () => {
  const [templates, setTemplates] = useState<BotTemplate[]>(mockTemplates)

  const toggleFavorite = useCallback((templateId: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId ? { ...template, isFavorite: !template.isFavorite } : template,
      ),
    )
  }, [])

  const purchaseTemplate = useCallback((templateId: string) => {
    setTemplates((prev) =>
      prev.map((template) => (template.id === templateId ? { ...template, isPurchased: true } : template)),
    )
  }, [])

  return {
    templates,
    toggleFavorite,
    purchaseTemplate,
  }
}
