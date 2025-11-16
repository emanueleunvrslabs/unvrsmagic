import type React from "react"
import { SettingsSection } from "../shared/settings-section"
import { ProfileForm } from "./profile-form"
import { ProfessionalInfo } from "./professional-info"
import { SocialProfiles } from "./social-profiles"
import type { UserProfile } from "../../types"

interface ProfileTabProps {
  profile: UserProfile
  onProfileChange: (updates: Partial<UserProfile>) => void
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile, onProfileChange }) => {
  return (
    <div className="space-y-6">
      <SettingsSection title="Personal Information" description="Update your personal details and contact information">
        <ProfileForm profile={profile} onProfileChange={onProfileChange} />
      </SettingsSection>

      <SettingsSection
        title="Professional Information"
        description="Add your professional background and trading experience"
      >
        <ProfessionalInfo profile={profile} onProfileChange={onProfileChange} />
      </SettingsSection>

      <SettingsSection title="Social Profiles" description="Connect your social media accounts">
        <SocialProfiles profile={profile} onProfileChange={onProfileChange} />
      </SettingsSection>
    </div>
  )
}
