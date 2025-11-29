import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { NewClientModal } from "@/components/admin/NewClientModal";
import { ClientCard } from "@/components/admin/ClientCard";
import { StrategyDetailsModal } from "@/components/strategies-marketplace-interface/components/strategy-details-modal";
import type { Strategy } from "@/components/strategies-marketplace-interface/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminClients() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Mock strategy data
  const mockStrategy: Strategy = {
    id: "1",
    name: "Breakout Momentum",
    description: "Advanced momentum strategy with breakout detection",
    category: "Breakout",
    rating: 4.8,
    reviews: 124,
    purchases: 1250,
    returns: {
      daily: 0.52,
      weekly: 3.64,
      monthly: 15.8,
      yearly: 189.6
    },
    winRate: 72.5,
    profitFactor: 2.3,
    maxDrawdown: 12.5,
    timeInMarket: 85,
    tradesPerDay: 4.5,
    supportedExchanges: ["Binance", "Coinbase", "Kraken"],
    supportedPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
    risk: "Medium",
    price: 299,
    isFree: false,
    isFeatured: true,
    isNew: false,
    isTrending: true,
    isPurchased: false,
    isFavorite: false,
    creator: {
      id: "creator1",
      name: "AlgoMaster Pro",
      avatar: "",
      verified: true,
      strategies: 12,
      followers: 5420
    },
    tags: ["Breakout", "Momentum", "Scalping"],
    lastUpdated: "2024-01-15",
    chartData: {
      "1D": [
        { date: "00:00", value: 0.1 },
        { date: "04:00", value: 0.3 },
        { date: "08:00", value: 0.2 },
        { date: "12:00", value: 0.4 },
        { date: "16:00", value: 0.5 },
        { date: "20:00", value: 0.52 }
      ],
      "1W": [
        { date: "Mon", value: 0.8 },
        { date: "Tue", value: 1.2 },
        { date: "Wed", value: 1.8 },
        { date: "Thu", value: 2.5 },
        { date: "Fri", value: 3.1 },
        { date: "Sat", value: 3.4 },
        { date: "Sun", value: 3.64 }
      ],
      "1M": [
        { date: "Week 1", value: 2.5 },
        { date: "Week 2", value: 6.3 },
        { date: "Week 3", value: 10.5 },
        { date: "Week 4", value: 15.8 }
      ],
      "3M": [
        { date: "Month 1", value: 8.2 },
        { date: "Month 2", value: 20.7 },
        { date: "Month 3", value: 36.5 }
      ],
      "6M": [
        { date: "Month 1", value: 5.1 },
        { date: "Month 2", value: 13.3 },
        { date: "Month 3", value: 25.8 },
        { date: "Month 4", value: 39.6 },
        { date: "Month 5", value: 56.3 },
        { date: "Month 6", value: 74.9 }
      ],
      "1Y": [
        { date: "Q1", value: 25.8 },
        { date: "Q2", value: 62.3 },
        { date: "Q3", value: 118.5 },
        { date: "Q4", value: 189.6 }
      ],
      All: [
        { date: "2022", value: 89.3 },
        { date: "2023", value: 145.7 },
        { date: "2024", value: 189.6 }
      ]
    }
  };

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          client_contacts (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleViewDetails = (client: any) => {
    setSelectedStrategy(mockStrategy);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedStrategy(null);
  };

  const handleToggleFavorite = (strategyId: string) => {
    // Not used for now
  };

  const handlePurchase = (strategyId: string) => {
    // Not used for now
  };

  if (roleLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isOwner) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your clients and their access to projects
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Client
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients && clients.length > 0 ? (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onViewDetails={handleViewDetails}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                No clients yet. Start by adding your first client using the "New Client" button above.
              </p>
            </div>
          )}
        </div>
      </div>

      <NewClientModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onSuccess={refetch}
      />

      <StrategyDetailsModal
        strategy={selectedStrategy}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        onToggleFavorite={handleToggleFavorite}
        onPurchase={handlePurchase}
      />
    </DashboardLayout>
  );
}
