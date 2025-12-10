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
