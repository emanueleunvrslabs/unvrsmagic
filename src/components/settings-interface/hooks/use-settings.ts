"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type {
  SettingsState,
  UserProfile,
  SecuritySettings,
  NotificationSettings,
  AppearanceSettings,
  TradingSettings,
  BotSettings,
  PrivacySettings,
  DataSettings,
} from "../types"
import { defaultSettingsState } from "../data"
import { hasUnsavedChanges, deepClone } from "../utils"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useSettings = () => {
  const [settings, setSettings] = useState<Omit<SettingsState, "hasUnsavedChanges">>(() => {
    const { hasUnsavedChanges: _, ...settingsWithoutFlag } = defaultSettingsState
    return settingsWithoutFlag
  })
  const [originalSettings, setOriginalSettings] = useState<Omit<SettingsState, "hasUnsavedChanges">>(() => {
    const { hasUnsavedChanges: _, ...settingsWithoutFlag } = defaultSettingsState
    return settingsWithoutFlag
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate hasUnsavedChanges using useMemo to avoid infinite loops
  const hasUnsavedChangesFlag = useMemo(() => {
    return hasUnsavedChanges(originalSettings, settings)
  }, [originalSettings, settings])

  // Load settings from localStorage and Supabase on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Load profile from Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, phone_number')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profile) {
            // Load saved settings from localStorage
            const savedSettings = localStorage.getItem("defibotx-settings");
            let parsedSettings = defaultSettingsState;
            
            if (savedSettings) {
              try {
                parsedSettings = JSON.parse(savedSettings);
              } catch (error) {
                console.error("Failed to parse saved settings:", error);
              }
            }

            // Merge with profile data from Supabase
            const { hasUnsavedChanges: _, ...settingsWithoutFlag } = parsedSettings;
            const updatedSettings = {
              ...settingsWithoutFlag,
              profile: {
                ...settingsWithoutFlag.profile,
                firstName: profile.username || '',
                phone: profile.phone_number || '',
              }
            };

            setSettings(updatedSettings);
            setOriginalSettings(deepClone(updatedSettings));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }))
  }, [])

  const updateSecurity = useCallback((updates: Partial<SecuritySettings>) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, ...updates },
    }))
  }, [])

  const updateNotifications = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates },
    }))
  }, [])

  const updateAppearance = useCallback((updates: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...updates },
    }))
  }, [])

  const updateTrading = useCallback((updates: Partial<TradingSettings>) => {
    setSettings((prev) => ({
      ...prev,
      trading: { ...prev.trading, ...updates },
    }))
  }, [])

  const updateBots = useCallback((updates: Partial<BotSettings>) => {
    setSettings((prev) => ({
      ...prev,
      bots: { ...prev.bots, ...updates },
    }))
  }, [])

  const updatePrivacy = useCallback((updates: Partial<PrivacySettings>) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, ...updates },
    }))
  }, [])

  const updateData = useCallback((updates: Partial<DataSettings>) => {
    setSettings((prev) => ({
      ...prev,
      data: { ...prev.data, ...updates },
    }))
  }, [])

  const setActiveTab = useCallback((tab: string) => {
    setSettings((prev) => ({ ...prev, activeTab: tab }))
  }, [])

  const saveSettings = useCallback(async () => {
    setIsSaving(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Save username to Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ 
            username: settings.profile.firstName.toLowerCase()
          })
          .eq('user_id', user.id);

        if (error) {
          if (error.code === '23505') {
            toast.error("Username already taken");
            return { success: false, error: "Username already taken" };
          }
          throw error;
        }
      }

      // Save to localStorage
      const settingsToSave = { ...settings, hasUnsavedChanges: false }
      localStorage.setItem("defibotx-settings", JSON.stringify(settingsToSave))

      // Update original settings to mark as saved
      setOriginalSettings(deepClone(settings))

      toast.success("Settings saved successfully");
      return { success: true }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings");
      return { success: false, error: "Failed to save settings" }
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  const resetSettings = useCallback(() => {
    setSettings(deepClone(originalSettings))
  }, [originalSettings])

  const resetToDefaults = useCallback(() => {
    const { hasUnsavedChanges: _, ...settingsWithoutFlag } = defaultSettingsState
    setSettings(settingsWithoutFlag)
  }, [])

  // Return settings with the calculated hasUnsavedChanges flag
  const settingsWithFlag = useMemo(
    () => ({
      ...settings,
      hasUnsavedChanges: hasUnsavedChangesFlag,
    }),
    [settings, hasUnsavedChangesFlag],
  )

  return {
    settings: settingsWithFlag,
    isLoading,
    isSaving,
    updateProfile,
    updateSecurity,
    updateNotifications,
    updateAppearance,
    updateTrading,
    updateBots,
    updatePrivacy,
    updateData,
    setActiveTab,
    saveSettings,
    resetSettings,
    resetToDefaults,
  }
}
