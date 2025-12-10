"use client";

import { SearchBar } from "@/components/search-bar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart,
  Bell,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Cog,
  Coins,
  Copy,
  Cpu,
  CreditCard,
  Database,
  ExternalLink,
  FileText,
  Folder,
  Gauge,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Package,
  PieChart,
  Repeat,
  Settings,
  Store,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Wallet,
  XIcon,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Topbar() {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { isConnected, address, balance, disconnect, copyAddress } = useWalletConnection();
  const { isOwner } = useUserRole();
  const navigate = useNavigate();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Load username from database
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profile?.username) {
            setUsername(profile.username);
          }
        }
      } catch (error) {
        console.error('Error loading username:', error);
      }
    };

    loadUsername();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end bg-background px-4 lg:h-16 lg:px-6">
      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Facebook */}
        <div className="iso-pro">
          <span></span>
          <span></span>
          <span></span>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <svg className="social-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
              <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path>
            </svg>
          </a>
          <div className="social-text">Facebook</div>
        </div>

        {/* Twitter */}
        <div className="iso-pro">
          <span></span>
          <span></span>
          <span></span>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="social-svg">
              <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
            </svg>
          </a>
          <div className="social-text">Twitter</div>
        </div>

        {/* Notifications */}
        <div className="iso-pro">
          <span></span>
          <span></span>
          <span></span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative">
                <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg" className="social-svg">
                  <path d="M224 512c35.32 0 63.97-28.65 63.97-64H160.03c0 35.35 28.65 64 63.97 64zm215.39-149.71c-19.32-20.76-55.47-51.99-55.47-154.29 0-77.7-54.48-139.9-127.94-155.16V32c0-17.67-14.32-32-31.98-32s-31.98 14.33-31.98 32v20.84C118.56 68.1 64.08 130.3 64.08 208c0 102.3-36.15 133.53-55.47 154.29-6 6.45-8.66 14.16-8.61 21.71.11 16.4 12.98 32 32.1 32h383.8c19.12 0 32-15.6 32.1-32 .05-7.55-2.61-15.27-8.61-21.71z"></path>
                </svg>
                <span className="absolute -right-1 -top-1 h-4 w-4 text-[9px] flex items-center justify-center bg-[#0a84ff] text-white rounded-full border-0">
                  3
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-[300px] bg-black/70 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 rounded-xl shadow-2xl"
            >
              <DropdownMenuLabel className="text-white/90 text-[15px] font-medium px-3 py-2">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="flex flex-col items-start py-2.5 px-3 cursor-default focus:bg-white/10 rounded-lg mx-1">
                <div className="flex w-full justify-between">
                  <span className="font-medium text-sm text-white/90">Bot Action</span>
                  <span className="text-xs text-white/50">2 min ago</span>
                </div>
                <span className="text-xs text-white/60">BTC signal triggered at $65,000</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-2.5 px-3 cursor-default focus:bg-white/10 rounded-lg mx-1">
                <div className="flex w-full justify-between">
                  <span className="font-medium text-sm text-white/90">Trade Alert</span>
                  <span className="text-xs text-white/50">15 min ago</span>
                </div>
                <span className="text-xs text-white/60">ETH trade completed: +2.3%</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-2.5 px-3 cursor-default focus:bg-white/10 rounded-lg mx-1">
                <div className="flex w-full justify-between">
                  <span className="font-medium text-sm text-white/90">System Notice</span>
                  <span className="text-xs text-white/50">1 hour ago</span>
                </div>
                <span className="text-xs text-white/60">New AI model update available</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer justify-center text-sm font-medium text-[#0a84ff] focus:bg-white/10 focus:text-[#0a84ff] rounded-lg mx-1 py-2">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="social-text">Notifications</div>
        </div>

        {/* Wallet Connection - only show if connected */}
        {isConnected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline-flex">{formatAddress(address)}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              <DropdownMenuLabel>Wallet Connected</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-mono text-sm">{formatAddress(address)}</div>
              </div>
              <div className="px-2 py-2">
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className="font-semibold">{balance} ETH</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>View on Explorer</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={disconnect}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Disconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

function MarketTicker({ symbol, price, change, isPositive }: { symbol: string; price: string; change: string; isPositive: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
      <div className="font-medium">{symbol}</div>
      <div className="text-sm">${price}</div>
      <div className={cn("text-xs", isPositive ? "text-emerald-500" : "text-rose-500")}>{change}</div>
    </div>
  );
}

function NotificationItem({ title, message, time }: { title: string; message: string; time: string }) {
  return (
    <DropdownMenuItem className="flex cursor-default flex-col items-start py-2">
      <div className="flex w-full justify-between">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <span className="text-xs">{message}</span>
    </DropdownMenuItem>
  );
}
