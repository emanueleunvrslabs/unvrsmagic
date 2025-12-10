"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  CircleDollarSign,
  FileText,
  Folder,
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
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProjects } from "@/hooks/useUserProjects";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  hasSubmenu?: boolean;
  submenuItems?: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    href?: string;
  }>;
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

type Props = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

export function DashboardSidebar({ collapsed, setCollapsed }: Props) {
  const location = useLocation();
  const pathname = location.pathname;
  const [activeItem, setActiveItem] = useState("");
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; phone_number: string } | null>(null);
  const [exchanges, setExchanges] = useState<Array<{ exchange: string }>>([]);
  const { isOwner, isAdmin, isUser } = useUserRole();
  const { userProjects } = useUserProjects();

  // Set active item based on pathname
  useEffect(() => {
    if (pathname === "/" || pathname === "/admin/dashboard") {
      setActiveItem("admin-dashboard");
    } else if (pathname === "/settings") {
      setActiveItem("settings");
    } else if (pathname.startsWith("/nkmt")) {
      setActiveItem("nkmt");
    } else if (pathname.startsWith("/ai-social")) {
      setActiveItem("ai-social");
    } else if (pathname.startsWith("/ai-art")) {
      setActiveItem("ai-art");
    } else if (pathname === "/delibere-arera") {
      setActiveItem("delibere-arera");
    } else if (pathname === "/marketplace") {
      setActiveItem("marketplace");
    } else if (pathname === "/wallet") {
      setActiveItem("wallet");
    } else if (pathname === "/admin/clients") {
      setActiveItem("admin-clients");
    } else if (pathname === "/file-upload") {
      setActiveItem("file-upload");
    }
  }, [pathname]);

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

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Build menu items based on role
  const menuSections: MenuSection[] = [];

  // Main section for all users
  if (isUser || isAdmin || isOwner) {
    const userItems: MenuItem[] = [
      { id: "marketplace", label: "Marketplace", icon: Store, href: "/marketplace" },
      { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
    ];

    // Add user projects if not admin/owner
    if (!isOwner && !isAdmin) {
      userProjects.forEach((up) => {
        if (up.project.route === '/ai-social') {
          userItems.push({
            id: `user-project-${up.project_id}`,
            label: up.project.name,
            icon: CircleDollarSign,
            hasSubmenu: true,
            submenuItems: [
              { id: "ai-social-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/ai-social" },
              { id: "ai-social-workflows", label: "Workflows", icon: Repeat, href: "/ai-social/workflows" },
              { id: "ai-social-generate-image", label: "Images", icon: Image, href: "/ai-social/generate-image" },
              { id: "ai-social-generate-video", label: "Videos", icon: Gauge, href: "/ai-social/generate-video" },
              { id: "ai-social-avatar-studio", label: "Avatar", icon: User, href: "/ai-social/avatar-studio" },
              { id: "ai-social-live-studio", label: "Live", icon: Radio, href: "/ai-social/live-studio" },
              { id: "ai-social-connection", label: "Connection", icon: Layers, href: "/ai-social/connection" },
            ],
          });
        } else if (up.project.route === '/ai-art') {
          userItems.push({
            id: `user-project-${up.project_id}`,
            label: up.project.name,
            icon: Wand2,
            hasSubmenu: true,
            submenuItems: [
              { id: "ai-art-generate-image", label: "Images", icon: Image, href: "/ai-art/generate-image" },
              { id: "ai-art-generate-video", label: "Videos", icon: Gauge, href: "/ai-art/generate-video" },
            ],
          });
        } else if (up.project.route === '/delibere-arera') {
          userItems.push({
            id: `user-project-${up.project_id}`,
            label: up.project.name,
            icon: FileText,
            href: "/delibere-arera",
          });
        } else if (up.project.route === '/nkmt') {
          userItems.push({
            id: `user-project-${up.project_id}`,
            label: up.project.name,
            icon: Layers,
            hasSubmenu: true,
            submenuItems: [
              { id: "nkmt-dashboard", label: "Dashboard", icon: Cpu, href: "/nkmt/dashboard" },
              { id: "nkmt-mkt-data", label: "Mkt.data", icon: Database, href: "/nkmt/mkt-data" },
            ],
          });
        }
      });
    }

    menuSections.push({ section: "", items: userItems });
  }

  // Admin section - only for owner
  if (isOwner) {
    menuSections.push({
      section: "Admin",
      items: [
        { id: "admin-dashboard", label: "Dashboard", icon: Home, href: "/admin/dashboard" },
        { id: "admin-clients", label: "Clients", icon: Users, href: "/admin/clients" },
        {
          id: "ai-social",
          label: "Ai Social",
          icon: CircleDollarSign,
          hasSubmenu: true,
          submenuItems: [
            { id: "ai-social-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/ai-social" },
            { id: "ai-social-workflows", label: "Workflows", icon: Repeat, href: "/ai-social/workflows" },
            { id: "ai-social-generate-image", label: "Images", icon: Image, href: "/ai-social/generate-image" },
            { id: "ai-social-generate-video", label: "Videos", icon: Gauge, href: "/ai-social/generate-video" },
            { id: "ai-social-avatar-studio", label: "Avatar", icon: User, href: "/ai-social/avatar-studio" },
            { id: "ai-social-live-studio", label: "Live", icon: Radio, href: "/ai-social/live-studio" },
            { id: "ai-social-connection", label: "Connection", icon: Layers, href: "/ai-social/connection" },
          ],
        },
        {
          id: "ai-art",
          label: "AI Art",
          icon: Wand2,
          hasSubmenu: true,
          submenuItems: [
            { id: "ai-art-generate-image", label: "Images", icon: Image, href: "/ai-art/generate-image" },
            { id: "ai-art-generate-video", label: "Videos", icon: Gauge, href: "/ai-art/generate-video" },
          ],
        },
        { id: "delibere-arera", label: "Delibere Arera", icon: FileText, href: "/delibere-arera" },
        {
          id: "nkmt",
          label: "NKMT",
          icon: Layers,
          hasSubmenu: true,
          submenuItems: [
            { id: "nkmt-dashboard", label: "Dashboard", icon: Cpu, href: "/nkmt/dashboard" },
            ...exchanges.map((ex) => ({
              id: `nkmt-${ex.exchange}`,
              label: ex.exchange.charAt(0).toUpperCase() + ex.exchange.slice(1),
              icon: Store,
              href: `/nkmt/${ex.exchange}`,
            })),
            { id: "nkmt-mkt-data", label: "Mkt.data", icon: Database, href: "/nkmt/mkt-data" },
            { id: "nkmt-deriv-data", label: "Deriv.data", icon: Database, href: "/nkmt/deriv-data" },
            { id: "nkmt-sentiment", label: "Sentiment.scout", icon: Activity, href: "/nkmt/sentiment-scout" },
            { id: "nkmt-chain", label: "Chain.analyst", icon: Layers, href: "/nkmt/chain-analyst" },
            { id: "nkmt-modeler", label: "Market.modeler", icon: PieChart, href: "/nkmt/market-modeler" },
            { id: "nkmt-signal", label: "Signal.maker", icon: Zap, href: "/nkmt/signal-maker" },
            { id: "nkmt-risk", label: "Risk.mgr", icon: CreditCard, href: "/nkmt/risk-mgr" },
            { id: "nkmt-executor", label: "Trade.executor", icon: Bot, href: "/nkmt/trade-executor" },
            { id: "nkmt-reviewer", label: "Reviewer", icon: FileText, href: "/nkmt/reviewer" },
          ],
        },
      ],
    });
  }

  // Admin-only projects for admin role
  if (isAdmin && !isOwner) {
    menuSections.push({
      section: "Admin",
      items: [
        { id: "admin-dashboard", label: "Dashboard", icon: Home, href: "/admin/dashboard" },
      ],
    });
  }

  // Preferences section
  menuSections.push({
    section: "Preferences",
    items: [
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
      { id: "file-upload", label: "Upload", icon: Upload, href: "/file-upload" },
    ],
  });

  const isItemActive = (item: MenuItem) => {
    if (item.href && pathname === item.href) return true;
    if (item.id === "ai-social" && pathname.startsWith("/ai-social")) return true;
    if (item.id === "ai-art" && pathname.startsWith("/ai-art")) return true;
    if (item.id === "nkmt" && pathname.startsWith("/nkmt")) return true;
    if (item.submenuItems?.some(sub => pathname === sub.href)) return true;
    return activeItem === item.id;
  };

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const isOpen = openSubmenus[item.id] || false;

    if (item.hasSubmenu && item.submenuItems) {
      return (
        <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleSubmenu(item.id)}>
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-[#0a84ff] text-white"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left font-normal">{item.label}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 mt-1 space-y-0.5">
              {item.submenuItems.map((subItem) => {
                const SubIcon = subItem.icon;
                const isSubActive = pathname === subItem.href;
                return (
                  <Link
                    key={subItem.id}
                    to={subItem.href || "#"}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] transition-all duration-200",
                      isSubActive
                        ? "bg-[#0a84ff] text-white"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                    )}
                  >
                    <SubIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-normal">{subItem.label}</span>
                  </Link>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.href || "#"}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-all duration-200",
          isActive
            ? "bg-[#0a84ff] text-white"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="font-normal">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#1c1c1e] flex flex-col z-50">
      {/* Search */}
      <div className="p-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/20 text-sidebar-foreground/50">
          <Search className="h-5 w-5" />
          <span className="text-[15px]">Search</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3">
        {menuSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-4">
            {section.section && (
              <div className="flex items-center gap-2 px-3 py-2 text-sidebar-foreground/50">
                <span className="text-[13px] font-normal">{section.section}</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => renderMenuItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border/20">
        <Link
          to="/settings?tab=profile"
          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent/30 transition-all duration-200"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src="" />
            <AvatarFallback className="bg-sidebar-accent/30 text-sidebar-foreground text-sm">
              {userProfile?.full_name?.[0] || userProfile?.phone_number?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-[15px] text-sidebar-foreground font-normal">
            {userProfile?.full_name || userProfile?.phone_number || "User"}
          </span>
        </Link>
      </div>
    </aside>
  );
}
