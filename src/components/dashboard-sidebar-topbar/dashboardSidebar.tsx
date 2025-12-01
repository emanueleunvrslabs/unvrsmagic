"use client";

import type React from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import unvrsLogo from "@/assets/unvrs-logo.jpeg";
import {
  Activity,
  Beaker,
  Bell,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Cog,
  Coins,
  Cpu,
  CreditCard,
  Database,
  FileText,
  Folder,
  Gauge,
  HelpCircle,
  Image,
  Layers,
  LayoutDashboard,
  LineChart,
  Menu,
  PieChart,
  Radio,
  Repeat,
  Settings,
  Store,
  Upload,
  User,
  Users,
  UserPlus,
  Wallet,
  Wand2,
  XIcon,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProjects } from "@/hooks/useUserProjects";
import { useMarketplaceProjects } from "@/hooks/useMarketplaceProjects";

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
    status?: 'active' | 'archived';
    hasSubmenu?: boolean;
    submenuItems?: Array<{
      id: string;
      label: string;
      icon: React.ElementType;
      href?: string;
    }>;
  }>;
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

interface FloatingSubmenuProps {
  item: MenuItem;
  isVisible: boolean;
  position: { x: number; y: number };
  activeItem: string;
  setActiveItem: (id: string) => void;
}

function FloatingSubmenu({ item, isVisible, position, activeItem, setActiveItem }: FloatingSubmenuProps) {
  if (!isVisible || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[200px] max-w-[250px] transition-all duration-200 z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/50">{item.label}</div>
      <div className="py-1">
        {item.submenuItems?.map((subItem) => {
          const SubIcon = subItem.icon;
          const isSubActive = activeItem === subItem.id;
          return (
            <Button
              key={subItem.id}
              variant="ghost"
              className={cn("w-full justify-start px-3 py-2 h-auto rounded-lg text-sm hover:bg-accent hover:text-accent-foreground", isSubActive && "bg-accent text-accent-foreground font-medium")}
              onClick={() => setActiveItem(subItem.id)}
              asChild={!!subItem.href}
            >
              {subItem.href ? (
                <Link to={subItem.href} className="flex items-center w-full">
                  {subItem.status && (
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2 flex-shrink-0",
                      subItem.status === 'active' ? "bg-green-500" : "bg-gray-400"
                    )} />
                  )}
                  <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{subItem.label}</span>
                </Link>
              ) : (
                <div className="flex items-center w-full">
                  {subItem.status && (
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2 flex-shrink-0",
                      subItem.status === 'active' ? "bg-green-500" : "bg-gray-400"
                    )} />
                  )}
                  <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{subItem.label}</span>
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

type Props = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

export function DashboardSidebar({ collapsed, setCollapsed }: Props) {
  const location = useLocation();
  const pathname = location.pathname;
  const [activeItem, setActiveItem] = useState("");
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    "settings": false,
    "nkmt": false,
    "projects": false,
    "ai-social": false,
    "ai-art": false,
  });
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [exchanges, setExchanges] = useState<Array<{ exchange: string }>>([]);
  const { isOwner, isAdmin, isUser } = useUserRole();
  const { userProjects } = useUserProjects();
  const { allProjects } = useMarketplaceProjects();
  const [hoveredSubmenu, setHoveredSubmenu] = useState<{
    item: MenuItem;
    position: { x: number; y: number };
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set active item based on pathname
  useEffect(() => {
    if (pathname === "/") {
      setActiveItem("dashboard");
    } else if (pathname === "/settings") {
      // Get tab from URL params
      const searchParams = new URLSearchParams(location.search);
      const tab = searchParams.get('tab');
      if (tab === 'profile') {
        setActiveItem("settings-profile");
      } else if (tab === 'security') {
        setActiveItem("settings-security");
      } else if (tab === 'exchanges') {
        setActiveItem("settings-exchanges");
      } else {
        setActiveItem("settings");
      }
      setOpenSubmenus((prev) => ({ ...prev, "settings": true }));
    } else if (pathname.startsWith("/nkmt")) {
      // Handle NKMT agents and exchanges
      if (pathname === "/nkmt/dashboard") {
        setActiveItem("nkmt-dashboard");
      } else if (pathname === "/nkmt/bitget" || pathname === "/nkmt/binance" || pathname === "/nkmt/okx") {
        const exchange = pathname.split("/")[2];
        setActiveItem(`nkmt-${exchange}`);
      } else if (pathname === "/nkmt/mkt-data") {
        setActiveItem("nkmt-mkt-data");
      } else if (pathname === "/nkmt/deriv-data") {
        setActiveItem("nkmt-deriv-data");
      } else if (pathname === "/nkmt/sentiment-scout") {
        setActiveItem("nkmt-sentiment");
      } else if (pathname === "/nkmt/chain-analyst") {
        setActiveItem("nkmt-chain");
      } else if (pathname === "/nkmt/market-modeler") {
        setActiveItem("nkmt-modeler");
      } else if (pathname === "/nkmt/signal-maker") {
        setActiveItem("nkmt-signal");
      } else if (pathname === "/nkmt/risk-mgr") {
        setActiveItem("nkmt-risk");
      } else if (pathname === "/nkmt/trade-executor") {
        setActiveItem("nkmt-executor");
      } else if (pathname === "/nkmt/reviewer") {
        setActiveItem("nkmt-reviewer");
      }
      setOpenSubmenus((prev) => ({ ...prev, "nkmt": true }));
    } else if (pathname.startsWith("/ai-social")) {
      // Handle Ai Social routes
      if (pathname === "/ai-social") {
        setActiveItem("ai-social-dashboard");
      } else if (pathname === "/ai-social/generate-image") {
        setActiveItem("ai-social-generate-image");
      } else if (pathname === "/ai-social/generate-video") {
        setActiveItem("ai-social-generate-video");
      } else if (pathname === "/ai-social/avatar-studio") {
        setActiveItem("ai-social-avatar-studio");
      } else if (pathname === "/ai-social/live-studio") {
        setActiveItem("ai-social-live-studio");
      } else if (pathname === "/ai-social/schedule") {
        setActiveItem("ai-social-schedule");
      } else if (pathname === "/ai-social/workflows") {
        setActiveItem("ai-social-workflows");
      } else if (pathname === "/ai-social/connection") {
        setActiveItem("ai-social-connection");
      }
      setOpenSubmenus((prev) => ({ ...prev, "ai-social": true }));
    } else if (pathname.startsWith("/ai-art")) {
      // Handle AI Art routes
      if (pathname === "/ai-art/generate-image") {
        setActiveItem("ai-art-generate-image");
      } else if (pathname === "/ai-art/generate-video") {
        setActiveItem("ai-art-generate-video");
      }
      setOpenSubmenus((prev) => ({ ...prev, "ai-art": true }));
    } else if (pathname === "/notifications") {
      setActiveItem("notifications");
    } else if (pathname === "/file-upload") {
      setActiveItem("file-upload");
    } else if (pathname === "/labs") {
      setActiveItem("labs");
    } else {
      // Extract the main path without subpaths
      const mainPath = pathname.split("/")[1];
      if (mainPath) {
        setActiveItem(mainPath);
      }
    }
  }, [pathname, location.search]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle window resize to auto-collapse on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load projects from database
  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, status")
        .order("created_at", { ascending: false });
      
      if (data) {
        setProjects(data);
      }
    };

    fetchProjects();
  }, []);

  // Load connected exchanges from database
  useEffect(() => {
    const fetchExchanges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("exchange_keys")
        .select("exchange")
        .eq("user_id", user.id);
      
      if (data) {
        // Remove duplicates
        const uniqueExchanges = Array.from(new Set(data.map(item => item.exchange)))
          .map(exchange => ({ exchange }));
        setExchanges(uniqueExchanges);
      }
    };

    fetchExchanges();
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmenuHover = (item: MenuItem, element: HTMLElement) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const rect = element.getBoundingClientRect();
    
    // Calculate estimated submenu height (approximately 50px per item + header)
    const estimatedMenuHeight = (item.submenuItems?.length || 0) * 50 + 60;
    const viewportHeight = window.innerHeight;
    
    // Adjust y position to keep menu on screen
    let yPos = rect.top;
    if (yPos + estimatedMenuHeight > viewportHeight) {
      // Position menu to align with bottom of viewport with some padding
      yPos = Math.max(10, viewportHeight - estimatedMenuHeight - 10);
    }
    
    const position = {
      x: rect.right + 8, // 8px gap from the sidebar
      y: yPos,
    };

    setHoveredSubmenu({ item, position });
  };

  const handleSubmenuLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSubmenu(null);
    }, 150); // Small delay to allow moving to submenu
  };

  // Build menu items based on role
  const menuItems: MenuSection[] = [];

  // User section - for all users
  if (isUser || isAdmin || isOwner) {
    // Only show user-added projects for regular users (not owner/admin)
    const userProjectItems = (isOwner || isAdmin) ? [] : userProjects.map((up) => {
      // Special handling for NKMT project
      if (up.project.route === '/nkmt') {
        return {
          id: `user-project-${up.project_id}`,
          label: up.project.name,
          icon: Layers,
          hasSubmenu: true,
          submenuItems: [
            { id: "settings-exchanges", label: "Exchange Connection", icon: Store, href: "/settings?tab=exchanges" },
            { id: "nkmt-dashboard", label: "NKMT", icon: Cpu, href: "/nkmt/dashboard" },
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
        };
      }
      
      // Special handling for Ai Social project
      if (up.project.route === '/ai-social') {
        return {
          id: `user-project-${up.project_id}`,
          label: up.project.name,
          icon: CircleDollarSign,
          hasSubmenu: true,
          submenuItems: [
            { id: "ai-social-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/ai-social" },
            { id: "ai-social-workflows", label: "Automated Workflows", icon: Repeat, href: "/ai-social/workflows" },
            { id: "ai-social-generate-image", label: "Generate Images", icon: Image, href: "/ai-social/generate-image" },
            { id: "ai-social-generate-video", label: "Generate Videos", icon: Gauge, href: "/ai-social/generate-video" },
            { id: "ai-social-avatar-studio", label: "Avatar Studio", icon: User, href: "/ai-social/avatar-studio" },
            { id: "ai-social-live-studio", label: "Live Studio", icon: Radio, href: "/ai-social/live-studio" },
            { id: "ai-social-connection", label: "Connection", icon: Layers, href: "/ai-social/connection" },
          ],
        };
      }
      
      // Special handling for AI Art project
      if (up.project.route === '/ai-art') {
        return {
          id: `user-project-${up.project_id}`,
          label: up.project.name,
          icon: Wand2,
          hasSubmenu: true,
          submenuItems: [
            { id: "ai-art-generate-image", label: "Generate Images", icon: Image, href: "/ai-art/generate-image" },
            { id: "ai-art-generate-video", label: "Generate Videos", icon: Gauge, href: "/ai-art/generate-video" },
          ],
        };
      }
      
      // Generic handling for other projects
      return {
        id: `user-project-${up.project_id}`,
        label: up.project.name,
        icon: Folder,
        hasSubmenu: true,
        submenuItems: [
          { id: `user-project-${up.project_id}-dashboard`, label: "Dashboard", icon: LayoutDashboard, href: `/projects/${up.project_id}` },
        ],
      };
    });

    menuItems.push({
      section: "User",
      items: [
        { id: "marketplace", label: "Marketplace", icon: Store, href: "/marketplace" },
        { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
        ...userProjectItems,
      ],
    });
  }

  // Admin section - only for owner
  if (isOwner) {
    menuItems.push({
      section: "Admin",
      items: [
        { id: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
        { id: "admin-clients", label: "Clients", icon: Users, href: "/admin/clients" },
        {
          id: "ai-social",
          label: "Ai Social",
          icon: CircleDollarSign,
          hasSubmenu: true,
          submenuItems: [
            { id: "ai-social-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/ai-social" },
            { id: "ai-social-workflows", label: "Automated Workflows", icon: Repeat, href: "/ai-social/workflows" },
            { id: "ai-social-generate-image", label: "Generate Images", icon: Gauge, href: "/ai-social/generate-image" },
            { id: "ai-social-generate-video", label: "Generate Videos", icon: Gauge, href: "/ai-social/generate-video" },
            { id: "ai-social-avatar-studio", label: "Avatar Studio", icon: User, href: "/ai-social/avatar-studio" },
            { id: "ai-social-live-studio", label: "Live Studio", icon: Radio, href: "/ai-social/live-studio" },
            { id: "ai-social-connection", label: "Connection", icon: Layers, href: "/ai-social/connection" },
          ],
        },
        {
          id: "ai-art",
          label: "AI Art",
          icon: Wand2,
          hasSubmenu: true,
          submenuItems: [
            { id: "ai-art-generate-image", label: "Generate Images", icon: Image, href: "/ai-art/generate-image" },
            { id: "ai-art-generate-video", label: "Generate Videos", icon: Gauge, href: "/ai-art/generate-video" },
          ],
        },
        {
          id: "nkmt",
          label: "NKMT",
          icon: Layers,
          hasSubmenu: true,
          submenuItems: [
            { id: "settings-exchanges", label: "Exchange Connection", icon: Store, href: "/settings?tab=exchanges" },
            { id: "nkmt-dashboard", label: "NKMT", icon: Cpu, href: "/nkmt/dashboard" },
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
        { id: "admin-projects", label: "Project Management", icon: Settings, href: "/admin/projects" },
      ],
    });
  }

  // Preferences section - for all users
  menuItems.push({
    section: "Preferences",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
      { id: "file-upload", label: "Upload", icon: Upload, href: "/file-upload" },
      { id: "strategies-marketplace", label: "Strategies Marketplace", icon: Store, href: "/strategies-marketplace" },
      { id: "labs", label: "Labs", icon: Beaker, href: "/labs" },
    ],
  });

  const footerItems: MenuItem[] = [];

  return (
    <>
      {!collapsed && <div className="fixed inset-0 bg-black/50 z-40 " onClick={() => setCollapsed(true)} />}

      {/* Sidebar */}
      <aside
        className={cn("fixed flex h-full flex-col border-r border-border bg-card transition-all duration-300 ease-in-out z-40", collapsed ? "w-[72px] max-sm:left-[-72px]" : "sm:left-0 w-auto min-w-[240px] max-w-[400px]")}
      >
        {/* Collapse toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-10 max-sm:-mt-2 sm:-right-3 top-6 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4 max-sm:hidden" /> : <ChevronLeft className="h-4 w-4 max-sm:hidden" />}
          {collapsed ? <Menu className="h-4 w-4 max-sm:block hidden" /> : <XIcon className="h-4 w-4 max-sm:block hidden" />}
        </button>

        {/* Header */}
        <div className={cn("flex h-16 items-center py-4 transition-all duration-300", collapsed ? "justify-center px-2" : "px-3")}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden flex-shrink-0">
              <img src={unvrsLogo} alt="UNVRS Labs" className="h-8 w-8 object-cover" />
            </div>
            <div className={cn(
              "flex flex-col transition-all duration-300 ease-in-out",
              collapsed ? "hidden" : "block"
            )}>
              <span className="text-lg font-semibold tracking-tight whitespace-nowrap">UNVRS MAGIC AI</span>
            </div>
          </div>
        </div>

        {/* Wrap the entire sidebar content in a TooltipProvider */}
        <TooltipProvider delayDuration={0}>
          {/* Menu sections */}
          <div className="flex-1 overflow-auto py-2">
            {menuItems.map((section) => (
              <div key={section.section} className="px-3 py-2">
                {!collapsed && <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">{section.section}</div>}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.id;

                    // Handle items with submenus
                    if (item.hasSubmenu && !collapsed) {
                      const isParentActive = item.submenuItems?.some((subItem) => activeItem === subItem.id) || activeItem === item.id;

                      return (
                        <div key={item.id} className="space-y-1">
                          <Collapsible open={openSubmenus[item.id]} className="space-y-1">
                            <CollapsibleTrigger asChild>
                          <Button
                            variant={isParentActive ? "secondary" : "ghost"}
                            className="w-full justify-between px-4 rounded-lg whitespace-nowrap"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSubmenu(item.id);
                            }}
                          >
                            <div className="flex items-center min-w-0">
                              <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200 ml-2", openSubmenus[item.id] ? "rotate-180" : "rotate-0")} />
                          </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-6 space-y-1">
                              {item.submenuItems?.map((subItem) => {
                                const SubIcon = subItem.icon;
                                const isSubActive = activeItem === subItem.id;
                                
                                // Handle nested submenus
                                if (subItem.hasSubmenu) {
                                  const isNestedParentActive = subItem.submenuItems?.some((nestedItem) => activeItem === nestedItem.id) || activeItem === subItem.id;
                                  
                                  return (
                                    <div key={subItem.id} className="space-y-1">
                                      <Collapsible open={openSubmenus[subItem.id]} className="space-y-1">
                                        <CollapsibleTrigger asChild>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant={isNestedParentActive ? "secondary" : "ghost"}
                                                className="w-full justify-between px-4 rounded-lg whitespace-nowrap"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  toggleSubmenu(subItem.id);
                                                }}
                                              >
                                                <div className="flex items-center min-w-0">
                                                  <SubIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                                  <span className="truncate">{subItem.label}</span>
                                                </div>
                                                <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200 ml-2", openSubmenus[subItem.id] ? "rotate-180" : "rotate-0")} />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border z-[9999]">
                                              {subItem.label}
                                            </TooltipContent>
                                          </Tooltip>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pl-6 space-y-1">
                                          {subItem.submenuItems?.map((nestedItem) => {
                                            const NestedIcon = nestedItem.icon;
                                            const isNestedActive = activeItem === nestedItem.id;
                                            return (
                                              <Tooltip key={nestedItem.id}>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant={isNestedActive ? "secondary" : "ghost"}
                                                    className="w-full justify-start rounded-lg whitespace-nowrap"
                                                    onClick={() => setActiveItem(nestedItem.id)}
                                                    asChild={!!nestedItem.href}
                                                  >
                                                    {nestedItem.href ? (
                                                      <Link to={nestedItem.href} className="flex items-center w-full min-w-0">
                                                        <NestedIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">{nestedItem.label}</span>
                                                      </Link>
                                                    ) : (
                                                      <div className="flex items-center w-full min-w-0">
                                                        <NestedIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">{nestedItem.label}</span>
                                                      </div>
                                                    )}
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border z-[9999]">
                                                  {nestedItem.label}
                                                </TooltipContent>
                                              </Tooltip>
                                            );
                                          })}
                                        </CollapsibleContent>
                                      </Collapsible>
                                    </div>
                                  );
                                }
                                
                                // Regular submenu item without nesting
                                return (
                                  <Tooltip key={subItem.id}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant={isSubActive ? "secondary" : "ghost"}
                                        className="w-full justify-start rounded-lg whitespace-nowrap"
                                        onClick={() => setActiveItem(subItem.id)}
                                        asChild={!!subItem.href}
                                      >
                                        {subItem.href ? (
                                          <Link to={subItem.href} className="flex items-center w-full min-w-0">
                                            {subItem.status && (
                                              <div className={cn(
                                                "w-2 h-2 rounded-full mr-2 flex-shrink-0",
                                                subItem.status === 'active' ? "bg-green-500" : "bg-gray-400"
                                              )} />
                                            )}
                                            <SubIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                            <span className="truncate">{subItem.label}</span>
                                          </Link>
                                        ) : (
                                          <div className="flex items-center w-full min-w-0">
                                            {subItem.status && (
                                              <div className={cn(
                                                "w-2 h-2 rounded-full mr-2 flex-shrink-0",
                                                subItem.status === 'active' ? "bg-green-500" : "bg-gray-400"
                                              )} />
                                            )}
                                            <SubIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                            <span className="truncate">{subItem.label}</span>
                                          </div>
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border z-[9999]">
                                      {subItem.label}
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      );
                    }

                    // Handle items with submenus when collapsed - with floating submenu
                    if (collapsed && item.hasSubmenu) {
                      const isParentActive = item.submenuItems?.some((subItem) => activeItem === subItem.id) || activeItem === item.id;

                      return (
                        <div key={item.id} className="relative">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isParentActive ? "secondary" : "ghost"}
                                className="w-full justify-center px-2 rounded-lg"
                                onClick={() => setActiveItem(item.id)}
                                onMouseEnter={(e) => handleSubmenuHover(item, e.currentTarget)}
                                onMouseLeave={handleSubmenuLeave}
                              >
                                <Icon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-normal">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    }

                    // Regular menu items (existing code remains the same)
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          {item.href ? (
                            <Button variant={isActive ? "secondary" : "ghost"} className={cn("w-full justify-start rounded-lg", collapsed ? "px-2 justify-center" : "px-4")} asChild>
                              <Link to={item.href}>
                                <Icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-2")} />
                                {!collapsed && <span>{item.label}</span>}
                              </Link>
                            </Button>
                          ) : (
                            <Button variant={isActive ? "secondary" : "ghost"} className={cn("w-full justify-start rounded-lg", collapsed ? "px-2 justify-center" : "px-2")} onClick={() => setActiveItem(item.id)}>
                              <Icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-2")} />
                              {!collapsed && <span>{item.label}</span>}
                            </Button>
                          )}
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right" className="font-normal">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {footerItems.length > 0 && (
            <div className="mt-auto p-3">
              <div className="space-y-1">
                {footerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;

                  // Regular footer item (no submenu in Settings anymore)
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        {'href' in item && item.href ? (
                          <Button variant="ghost" className={cn("w-full justify-start rounded-lg", collapsed ? "px-2 justify-center" : "px-2")} asChild>
                            <Link to={item.href}>
                              <Icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-2")} />
                              {!collapsed && <span>{item.label}</span>}
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="ghost" className={cn("w-full justify-start rounded-lg", collapsed ? "px-2 justify-center" : "px-2")} onClick={() => setActiveItem(item.id)}>
                            <Icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-2")} />
                            {!collapsed && <span>{item.label}</span>}
                          </Button>
                        )}
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="font-normal">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}
        </TooltipProvider>
      </aside>

      {/* Floating Submenu */}
      {hoveredSubmenu && (
        <div
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
          }}
          onMouseLeave={handleSubmenuLeave}
        >
          <FloatingSubmenu item={hoveredSubmenu.item} isVisible={true} position={hoveredSubmenu.position} activeItem={activeItem} setActiveItem={setActiveItem} />
        </div>
      )}
    </>
  );
}
