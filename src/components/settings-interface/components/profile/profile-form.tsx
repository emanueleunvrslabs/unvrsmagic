"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserProfile } from "../../types"
import { validatePhone } from "../../utils"

interface ProfileFormProps {
  profile: UserProfile
  onProfileChange: (updates: Partial<UserProfile>) => void
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onProfileChange }) => {
  const handleInputChange =
    (field: keyof UserProfile) => (event: React.ChangeEvent<HTMLInputElement>) => {
      onProfileChange({ [field]: event.target.value })
    }

  const isPhoneValid = validatePhone(profile.phone)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          value={profile.firstName}
          onChange={handleInputChange("firstName")}
          placeholder="Enter your first name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={profile.lastName}
          onChange={handleInputChange("lastName")}
          placeholder="Enter your last name"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={profile.phone}
          onChange={handleInputChange("phone")}
          placeholder="Enter your phone number"
          className={!isPhoneValid && profile.phone ? "border-destructive" : ""}
        />
        {!isPhoneValid && profile.phone && (
          <p className="text-sm text-destructive">Please enter a valid phone number</p>
        )}
      </div>
    </div>
  )
}
