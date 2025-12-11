import type React from "react"

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children, className = "" }) => {
  return (
    <div className={`labs-client-card p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
