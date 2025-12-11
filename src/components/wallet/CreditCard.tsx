import "../labs/SocialMediaCard.css";
import { TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const CREDIT_PACKAGES = [
  { id: "credits_10", amount: 10, price: "€10", description: "10 images or 1 video" },
  { id: "credits_50", amount: 50, price: "€50", description: "50 images or 5 videos" },
  { id: "credits_100", amount: 100, price: "€100", description: "100 images or 10 videos" },
  { id: "credits_250", amount: 250, price: "€250", description: "250 images or 25 videos" },
  { id: "credits_500", amount: 500, price: "€500", description: "500 images or 50 videos" },
  { id: "credits_1000", amount: 1000, price: "€1000", description: "1000 images or 100 videos" },
];

export function CreditCard() {
  const { credits, purchaseCredits, isPurchasing } = useUserCredits();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <>
      <div className="labs-client-card w-full max-w-2xl rounded-[22px] p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Wallet className="w-6 h-6 text-white/80" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Credit Balance</h2>
              <p className="text-sm text-white/50">Your available credits for content generation</p>
            </div>
          </div>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-white/90 text-sm font-medium hover:from-purple-500/30 hover:to-cyan-500/30 hover:border-purple-500/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Credits
          </button>
        </div>
        
        {/* Balance Display */}
        <div className="text-center mb-10">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-6xl font-bold text-white tracking-tight">
              {formatCurrency(credits?.balance || 0)}
            </span>
          </div>
          <p className="text-white/40 text-sm mt-2">Available Balance</p>
        </div>
        
        {/* Stats */}
        <div className="flex gap-6 justify-center">
          <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white/50 text-sm">Purchased</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(credits?.total_purchased || 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white/50 text-sm">Spent</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(credits?.total_spent || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0B0B0D]/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Purchase Credits</DialogTitle>
            <DialogDescription className="text-white/60">
              Select a credit package. Credits are used for AI content generation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <Button
                key={pkg.id}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                onClick={() => {
                  purchaseCredits(pkg.id);
                  setIsDialogOpen(false);
                }}
                disabled={isPurchasing}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-white">{pkg.price}</span>
                  <Badge variant="secondary" className="bg-white/10 text-white/80">{pkg.amount} credits</Badge>
                </div>
                <span className="text-xs text-white/50">{pkg.description}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
