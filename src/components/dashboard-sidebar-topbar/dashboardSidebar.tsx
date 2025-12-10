"use client";

import type React from "react";
import { createPortal } from "react-dom";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Database,
  FileText,
  Folder,
  Gauge,
  Image,
  Layers,
  LayoutDashboard,
  Menu,
  PieChart,
  Radio,
  Repeat,
  Search,
  Settings,
  Store,
  Upload,
  User,
  Users,
  Wallet,
  Wand2,
  XIcon,
  Zap,
  Home,
  Cpu,
} from "lucide-react";
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
  isSpacer?: boolean;
  submenuItems?: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    href?: string;
    status?: 'active' | 'archived';
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
      className="fixed bg-sidebar/95 backdrop-blur-xl border border-sidebar-border rounded-xl shadow-2xl py-2 min-w-[220px] transition-all duration-200 z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      <div className="px-4 py-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">{item.label}</div>
      <div className="px-2">
        {item.submenuItems?.map((subItem) => {
          const SubIcon = subItem.icon;
          const isSubActive = activeItem === subItem.id;
          return (
            <Link
              key={subItem.id}
              to={subItem.href || "#"}
              onClick={() => setActiveItem(subItem.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isSubActive 
                  ? "bg-primary/20 text-primary" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <SubIcon className="h-[18px] w-[18px]" />
              <span className="font-medium">{subItem.label}</span>
            </Link>
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
    "delibere-arera": false,
  });
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [exchanges, setExchanges] = useState<Array<{ exchange: string }>>([]);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; phone_number: string } | null>(null);
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
      if (pathname === "/ai-art/generate-image") {
        setActiveItem("ai-art-generate-image");
      } else if (pathname === "/ai-art/generate-video") {
        setActiveItem("ai-art-generate-video");
      }
      setOpenSubmenus((prev) => ({ ...prev, "ai-art": true }));
    } else if (pathname === "/delibere-arera") {
      setActiveItem("delibere-arera");
    } else if (pathname === "/notifications") {
      setActiveItem("notifications");
    } else if (pathname === "/file-upload") {
      setActiveItem("file-upload");
    } else if (pathname === "/labs") {
      setActiveItem("labs");
    } else if (pathname === "/admin/dashboard") {
      setActiveItem("admin-dashboard");
    } else if (pathname === "/admin/clients") {
      setActiveItem("admin-clients");
    } else if (pathname === "/marketplace") {
      setActiveItem("marketplace");
    } else if (pathname === "/wallet") {
      setActiveItem("wallet");
    } else {
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
        const uniqueExchanges = Array.from(new Set(data.map(item => item.exchange)))
          .map(exchange => ({ exchange }));
        setExchanges(uniqueExchanges);
      }
    };
    fetchExchanges();
  }, []);

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
    const estimatedMenuHeight = (item.submenuItems?.length || 0) * 50 + 60;
    const viewportHeight = window.innerHeight;
    
    let yPos = rect.top;
    if (yPos + estimatedMenuHeight > viewportHeight) {
      yPos = Math.max(10, viewportHeight - estimatedMenuHeight - 10);
    }
    
    const position = {
      x: rect.right + 8,
      y: yPos,
    };

    setHoveredSubmenu({ item, position });
  };

  const handleSubmenuLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSubmenu(null);
    }, 150);
  };

  // Build menu items based on role
  const menuItems: MenuSection[] = [];

  // User section - for all users
  if (isUser || isAdmin || isOwner) {
    const userProjectItems = (isOwner || isAdmin) ? [] : userProjects.map((up) => {
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
      
      if (up.project.route === '/delibere-arera') {
        return {
          id: `user-project-${up.project_id}`,
          label: up.project.name,
          icon: FileText,
          href: "/delibere-arera",
        };
      }
      
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
      section: "",
      items: [
        { id: "marketplace", label: "Marketplace", icon: Store, href: "/marketplace" },
        { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
        ...(userProjectItems.length > 0 ? [{ id: "spacer-user-1", isSpacer: true, label: "", icon: LayoutDashboard }] : []),
        ...userProjectItems,
      ],
    });
  }

  // Admin section - only for owner
  if (isOwner) {
    menuItems.push({
      section: "Admin",
      items: [
        { id: "admin-dashboard", label: "Dashboard", icon: Home, href: "/admin/dashboard" },
        { id: "admin-clients", label: "Clients", icon: Users, href: "/admin/clients" },
        { id: "spacer-1", isSpacer: true, label: "", icon: LayoutDashboard },
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
        { id: "delibere-arera", label: "Delibere Arera", icon: FileText, href: "/delibere-arera" },
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
      ],
    });
  }

  // Admin users - only for admin role
  if (isAdmin && !isOwner) {
    menuItems.push({
      section: "Admin",
      items: [
        { id: "admin-dashboard", label: "Dashboard", icon: Home, href: "/admin/dashboard" },
        { id: "admin-clients", label: "Clients", icon: Users, href: "/admin/clients" },
      ],
    });
  }

  // Footer items
  const footerItems = [
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
    { id: "file-upload", label: "Upload", icon: Upload, href: "/file-upload" },
  ];

  if (!mounted) return null;

  // Apple TV style menu item component
  const MenuItemComponent = ({ item, isActive, collapsed: isCollapsed }: { item: MenuItem; isActive: boolean; collapsed: boolean }) => {
    const Icon = item.icon;
    
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={item.href || "#"}
              className={cn(
                "flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-200 mx-auto",
                isActive 
                  ? "bg-primary/20 text-primary" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <Link
        to={item.href || "#"}
        className={cn(
          "flex items-center gap-3 h-11 px-3 rounded-xl transition-all duration-200",
          isActive 
            ? "bg-primary/20 text-primary" 
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium text-[15px]">{item.label}</span>
      </Link>
    );
  };

  // Apple TV style collapsible menu
  const CollapsibleMenuComponent = ({ item, isCollapsed }: { item: MenuItem; isCollapsed: boolean }) => {
    const Icon = item.icon;
    const isParentActive = item.submenuItems?.some((subItem) => activeItem === subItem.id) || activeItem === item.id;
    
    if (isCollapsed) {
      return (
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-200 mx-auto",
                  isParentActive 
                    ? "bg-primary/20 text-primary" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                onMouseEnter={(e) => handleSubmenuHover(item, e.currentTarget)}
                onMouseLeave={handleSubmenuLeave}
              >
                <Icon className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }
    
    return (
      <Collapsible open={openSubmenus[item.id]} className="space-y-1">
        <CollapsibleTrigger asChild>
          <button
            onClick={() => toggleSubmenu(item.id)}
            className={cn(
              "flex items-center justify-between w-full h-11 px-3 rounded-xl transition-all duration-200",
              isParentActive 
                ? "text-sidebar-foreground" 
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-[15px]">{item.label}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              openSubmenus[item.id] ? "rotate-180" : "rotate-0"
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-0.5 ml-2">
          {item.submenuItems?.map((subItem) => {
            const SubIcon = subItem.icon;
            const isSubActive = activeItem === subItem.id;
            return (
              <Link
                key={subItem.id}
                to={subItem.href || "#"}
                onClick={() => setActiveItem(subItem.id)}
                className={cn(
                  "flex items-center gap-3 h-10 px-3 rounded-xl transition-all duration-200",
                  isSubActive 
                    ? "bg-primary/20 text-primary" 
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <SubIcon className="h-[18px] w-[18px] flex-shrink-0" />
                <span className="text-sm font-medium">{subItem.label}</span>
              </Link>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Collapse toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 shadow-sm hover:text-sidebar-foreground transition-colors max-sm:-right-10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4 max-sm:hidden" /> : <ChevronLeft className="h-4 w-4 max-sm:hidden" />}
          {collapsed ? <Menu className="h-4 w-4 max-sm:block hidden" /> : <XIcon className="h-4 w-4 max-sm:block hidden" />}
        </button>

        <TooltipProvider delayDuration={0}>
          {/* Search/Header area */}
          <div className={cn("px-3 pt-6 pb-4", collapsed && "px-2")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-primary/20 text-primary mx-auto">
                    <Search className="h-5 w-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Search
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 h-11 px-3 rounded-xl bg-primary/20 text-primary">
                <Search className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-[15px]">Search</span>
              </div>
            )}
          </div>

          {/* Menu sections */}
          <div className="flex-1 overflow-auto px-3 space-y-6">
            {menuItems.map((section, sectionIndex) => (
              <div key={section.section || `section-${sectionIndex}`}>
                {/* Section header - Apple TV style */}
                {section.section && !collapsed && (
                  <div className="flex items-center justify-between px-3 mb-2">
                    <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                      {section.section}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                  </div>
                )}
                
                <div className="space-y-1">
                  {section.items.map((item) => {
                    // Handle spacer items
                    if ('isSpacer' in item && item.isSpacer) {
                      return <div key={item.id} className="h-3" />;
                    }
                    
                    const isActive = activeItem === item.id;

                    // Handle items with submenus
                    if (item.hasSubmenu) {
                      return (
                        <CollapsibleMenuComponent 
                          key={item.id} 
                          item={item} 
                          isCollapsed={collapsed} 
                        />
                      );
                    }

                    // Regular menu items
                    return (
                      <MenuItemComponent 
                        key={item.id} 
                        item={item} 
                        isActive={isActive} 
                        collapsed={collapsed} 
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer with settings and user profile */}
          <div className="mt-auto px-3 pb-4 space-y-3">
            {/* Footer items */}
            <div className="space-y-1">
              {footerItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                
                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-200 mx-auto",
                            isActive 
                              ? "bg-primary/20 text-primary" 
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 h-11 px-3 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-primary/20 text-primary" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium text-[15px]">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User profile - Apple TV style */}
            {userProfile && (
              <div className={cn(
                "flex items-center gap-3 p-2 rounded-xl",
                collapsed ? "justify-center" : ""
              )}>
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm font-medium">
                    {userProfile.full_name 
                      ? userProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {userProfile.full_name || userProfile.phone_number}
                  </span>
                )}
              </div>
            )}
          </div>
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
