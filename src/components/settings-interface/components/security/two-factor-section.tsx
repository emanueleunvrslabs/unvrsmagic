"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield } from "lucide-react"

interface TwoFactorSectionProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

export function TwoFactorSection({ isEnabled, onToggle }: TwoFactorSectionProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">
              {isEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
        <Button
          variant={isEnabled ? "destructive" : "default"}
          onClick={() => onToggle(!isEnabled)}
        >
          {isEnabled ? "Disable" : "Enable"}
        </Button>
      </div>
    </Card>
  )
}
