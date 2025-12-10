"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  CircleDollarSign,
  FileText,
  Gauge,
  Home,
  Image,
  Layers,
  LayoutDashboard,
  Radio,
  Repeat,
  Search,
  Settings,
  Store,
  User,
  Users,
  Wallet,
  Wand2,
  Database,
  Activity,
  PieChart,
  Zap,
  CreditCard,
  Bot,
  Cpu,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProjects } from "@/hooks/useUserProjects";

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
};

type MenuSection = {
  title?: string;
  items: MenuItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

type Props = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

export function DashboardSidebar({ collapsed, setCollapsed }: Props) {
  const location = useLocation();
  const pathname = location.pathname;
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; phone_number: string } | null>(null);
  const [exchanges, setExchanges] = useState<Array<{ exchange: string }>>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const { isOwner, isAdmin, isUser } = useUserRole();
  const { userProjects } = useUserProjects();

  // Load user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone_number")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, []);

  // Load connected exchanges
  useEffect(() => {
    const fetchExchanges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("exchange_keys")
        .select("exchange")
        .eq("user_id", user.id);
      
      if (data) {
        const uniqueExchanges = Array.from(new Set(data.map(item => item.exchange)))
          .map(exchange => ({ exchange }));
        setExchanges(uniqueExchanges);
      }
    };
    fetchExchanges();
  }, []);

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isItemActive = (href?: string) => {
    if (!href) return false;
    if (href === pathname) return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  // Build menu sections
  const menuSections: MenuSection[] = [];

  // Main items for all users
  menuSections.push({
    items: [
      { id: "search", label: "Search", icon: Search, href: "/search" },
      { id: "marketplace", label: "Marketplace", icon: Store, href: "/marketplace" },
      { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
    ],
  });

  // Admin section - only for owner
  if (isOwner) {
    menuSections.push({
      title: "Admin",
      collapsible: true,
      defaultOpen: true,
      items: [
        { id: "admin-dashboard", label: "Dashboard", icon: Home, href: "/admin/dashboard" },
        { id: "admin-clients", label: "Clients", icon: Users, href: "/admin/clients" },
      ],
    });

    // Projects section
    menuSections.push({
      title: "Projects",
      collapsible: true,
      defaultOpen: true,
      items: [
        { id: "ai-social", label: "Ai Social", icon: CircleDollarSign, href: "/ai-social" },
        { id: "ai-art", label: "AI Art", icon: Wand2, href: "/ai-art/generate-image" },
        { id: "delibere-arera", label: "Delibere Arera", icon: FileText, href: "/delibere-arera" },
        { id: "nkmt", label: "NKMT", icon: Layers, href: "/nkmt/dashboard" },
      ],
    });
  }

  // User projects (for non-admin users)
  if (!isOwner && !isAdmin && userProjects.length > 0) {
    const projectItems: MenuItem[] = userProjects.map((up) => {
      if (up.project.route === '/ai-social') {
        return { id: `project-${up.project_id}`, label: up.project.name, icon: CircleDollarSign, href: "/ai-social" };
      } else if (up.project.route === '/ai-art') {
        return { id: `project-${up.project_id}`, label: up.project.name, icon: Wand2, href: "/ai-art/generate-image" };
      } else if (up.project.route === '/delibere-arera') {
        return { id: `project-${up.project_id}`, label: up.project.name, icon: FileText, href: "/delibere-arera" };
      } else if (up.project.route === '/nkmt') {
        return { id: `project-${up.project_id}`, label: up.project.name, icon: Layers, href: "/nkmt/dashboard" };
      }
      return { id: `project-${up.project_id}`, label: up.project.name, icon: LayoutDashboard, href: up.project.route };
    });

    if (projectItems.length > 0) {
      menuSections.push({
        title: "My Projects",
        collapsible: true,
        defaultOpen: true,
        items: projectItems,
      });
    }
  }

  // Preferences section
  menuSections.push({
    title: "Preferences",
    collapsible: true,
    defaultOpen: true,
    items: [
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
      { id: "upload", label: "Upload", icon: Upload, href: "/file-upload" },
    ],
  });

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item.href);

    return (
      <Link
        key={item.id}
        to={item.href || "#"}
        className={cn(
          "flex items-center gap-4 px-4 py-2.5 text-[17px] transition-all duration-150",
          isActive
            ? "bg-[#0a84ff] text-white rounded-xl mx-2"
            : "text-white/90 hover:text-white mx-2"
        )}
      >
        <Icon className="h-[22px] w-[22px] flex-shrink-0" strokeWidth={1.5} />
        <span className="font-normal">{item.label}</span>
      </Link>
    );
  };

  const renderSection = (section: MenuSection, index: number) => {
    const isOpen = section.title ? (openSections[section.title] ?? section.defaultOpen ?? true) : true;

    return (
      <div key={index} className="mb-2">
        {section.title && (
          <button
            onClick={() => section.collapsible && toggleSection(section.title!)}
            className="flex items-center justify-between w-full px-4 py-2 text-white/50 hover:text-white/70 transition-colors"
          >
            <span className="text-[15px] font-normal">{section.title}</span>
            {section.collapsible && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  !isOpen && "-rotate-90"
                )}
              />
            )}
          </button>
        )}
        {isOpen && (
          <div className="space-y-0.5">
            {section.items.map(renderMenuItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-black/60 backdrop-blur-3xl flex flex-col z-50">
      {/* Menu */}
      <nav className="flex-1 overflow-y-auto pt-4">
        {menuSections.map((section, idx) => renderSection(section, idx))}
      </nav>

      {/* User Profile */}
      <div className="p-4">
        <Link
          to="/settings?tab=profile"
          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/10 transition-all duration-200"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-sm font-medium">
              {userProfile?.full_name?.[0] || userProfile?.phone_number?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-[15px] text-white font-normal">
            {userProfile?.full_name || userProfile?.phone_number || "User"}
          </span>
        </Link>
      </div>
    </aside>
  );
}
