"use client";

import type React from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ExchangesTab } from "./components/exchanges/exchanges-tab";
import { toast } from "sonner";
import { AppearanceTab } from "./components/appearance/appearance-tab";
import { BotsTab } from "./components/bots/bots-tab";
import { ConnectionsTab } from "./components/connections/connections-tab";
import { DataTab } from "./components/data/data-tab";
import { NotificationsTab } from "./components/notifications/notifications-tab";
import { PrivacyTab } from "./components/privacy/privacy-tab";
import { ProfileTab } from "./components/profile/profile-tab";
import { SecurityTab } from "./components/security/security-tab";
import { SaveButton } from "./components/shared/save-button";
import { TradingTab } from "./components/trading/trading-tab";
import { useSettings } from "./hooks/use-settings";

export const SettingsInterface: React.FC = () => {
  const location = useLocation();
  const {
    settings,
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
  } = useSettings();

  // Set active tab from URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'exchanges'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search, setActiveTab]);

  const handleSave = async () => {
    const result = await saveSettings();
    if (result.success) {
      toast.success("Settings saved successfully");
    } else {
      toast.error(result.error || "Failed to save settings");
    }
  };

  const handleConnectionsChange = (connections: any[]) => {
    // Update connections in settings state
    // This would typically be handled by a separate hook or state management
    console.log("Connections updated:", connections);
  };

  const renderActiveTab = () => {
    switch (settings.activeTab) {
      case "profile":
        return <ProfileTab profile={settings.profile} onProfileChange={updateProfile} />;

      case "security":
        return (
          <SecurityTab
            security={settings.security}
            apiKeys={settings.apiKeys}
            sessions={settings.sessions}
            loginHistory={settings.loginHistory}
            onSecurityChange={updateSecurity}
            onApiKeysChange={(apiKeys) => updateSecurity({ apiKeysEnabled: apiKeys.length > 0 })}
            onSessionsChange={() => {}} // Sessions are managed separately
          />
        );

      case "exchanges":
        return (
          <ExchangesTab
            exchanges={[]}
            onExchangesChange={handleConnectionsChange}
          />
        );

      case "notifications":
        return <NotificationsTab notifications={settings.notifications} onNotificationsChange={updateNotifications} />;

      case "appearance":
        return <AppearanceTab appearance={settings.appearance} onAppearanceChange={updateAppearance} />;

      case "trading":
        return <TradingTab trading={settings.trading} onTradingChange={updateTrading} />;

      case "bots":
        return <BotsTab bots={settings.bots} onBotsChange={updateBots} />;

      case "privacy":
        return <PrivacyTab privacy={settings.privacy} onPrivacyChange={updatePrivacy} />;

      case "data":
        return <DataTab data={settings.data} onDataChange={updateData} />;

      case "connections":
        return <ConnectionsTab connections={settings.connections} onConnectionsChange={handleConnectionsChange} />;

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Settings Tab</h3>
              <p className="text-muted-foreground">Select a settings category from the sidebar</p>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {renderActiveTab()}
    </div>
  );
};
