"use client";

import { SearchBar } from "@/components/search-bar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    companyName: "",
    vatNumber: "",
    street: "",
    city: "",
    postalCode: "",
    country: ""
  });
  const { isConnected, address, balance, disconnect, copyAddress } = useWalletConnection();
  const { isOwner } = useUserRole();
  const navigate = useNavigate();

  const handleCreateClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from('clients').insert({
        user_id: user.id,
        company_name: newClient.companyName,
        vat_number: newClient.vatNumber,
        street: newClient.street,
        city: newClient.city,
        postal_code: newClient.postalCode,
        country: newClient.country
      });

      if (error) throw error;

      toast.success("Client created successfully");
      setShowNewClientModal(false);
      setNewClient({ companyName: "", vatNumber: "", street: "", city: "", postalCode: "", country: "" });
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Error creating client");
    }
  };

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-background px-4 lg:h-16 lg:px-6">
      {/* Left spacer */}
      <div className="flex-1" />
      
      {/* Center Menu */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/15">
          <button 
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white/80 hover:bg-white/10 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            New Client
          </button>
          <button className="px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white transition-all">
            Clients
          </button>
        </div>
      </div>
      
      {/* Right section */}
      <div className="flex-1 flex items-center justify-end gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 shadow-lg shadow-white/5">
              <Bell className="h-5 w-5" />
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

      {/* New Client Modal */}
      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-medium">New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Company Name</Label>
              <Input
                placeholder="Enter company name"
                value={newClient.companyName}
                onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">VAT Number</Label>
              <Input
                placeholder="Enter VAT number"
                value={newClient.vatNumber}
                onChange={(e) => setNewClient({ ...newClient, vatNumber: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Street</Label>
              <Input
                placeholder="Enter street address"
                value={newClient.street}
                onChange={(e) => setNewClient({ ...newClient, street: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">City</Label>
                <Input
                  placeholder="Enter city"
                  value={newClient.city}
                  onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Postal Code</Label>
                <Input
                  placeholder="Enter postal code"
                  value={newClient.postalCode}
                  onChange={(e) => setNewClient({ ...newClient, postalCode: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Country</Label>
              <Input
                placeholder="Enter country"
                value={newClient.country}
                onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
              />
            </div>
            <Button 
              onClick={handleCreateClient}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl mt-4"
            >
              Create Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
