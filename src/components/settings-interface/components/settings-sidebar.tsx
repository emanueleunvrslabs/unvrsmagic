"use client";

import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import type React from "react";
import { SETTINGS_TABS } from "../constants";

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasUnsavedChanges: boolean;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange, hasUnsavedChanges }) => {
  return (
    <div 
      className="md:w-64 rounded-2xl m-2"
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(40px) saturate(1.8)",
        WebkitBackdropFilter: "blur(40px) saturate(1.8)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.05) inset, 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
      </div>
      <div className="md:h-[calc(100vh-10rem)]">
        <div className="p-2 space-y-1">
          {SETTINGS_TABS.map((tab) => {
            const IconComponent = Icons[tab.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                className={cn(
                  "w-full justify-start text-left h-auto p-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-b from-white/[0.22] to-white/[0.12] text-white shadow-[0_0_0_0.5px_rgba(255,255,255,0.3)_inset,0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_16px_rgba(0,0,0,0.2)] border border-white/15"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <div className="flex items-start space-x-3">
                  <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-white/50 mt-1 whitespace-normal line-clamp-2">{tab.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
