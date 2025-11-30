import "../labs/SocialMediaCard.css";
import { TrendingUp, TrendingDown } from "lucide-react";
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
      <div className="social-media-card expanded-lateral">
        <div className="flex items-start justify-between w-full px-6 pt-6 pb-4 absolute top-0 left-0 right-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-white">Credit Balance</h2>
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">Your available credits for content generation</p>
          </div>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-blue-400 text-xs font-semibold hover:bg-white/10 transition-all"
          >
            + Add Credits
          </button>
        </div>
        
        <div className="card-main-content">
          <img
            src="https://uiverse.io/astronaut.png"
            alt="Astronaut"
            className="astronaut-image"
          />
        </div>
        
        <div className="flex flex-col justify-center items-center p-8 pt-16 h-full w-full max-w-4xl">
          <div className="mb-12">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-bold text-white">{formatCurrency(credits?.balance || 0)}</span>
            </div>
          </div>
          
          <div className="flex gap-16">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-gray-400 text-sm">Purchased</p>
                <p className="text-2xl font-semibold text-white">{formatCurrency(credits?.total_purchased || 0)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-gray-400 text-sm">Spent</p>
                <p className="text-2xl font-semibold text-white">{formatCurrency(credits?.total_spent || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Credits</DialogTitle>
            <DialogDescription>
              Select a credit package. Credits are used for AI content generation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <Button
                key={pkg.id}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-1"
                onClick={() => {
                  purchaseCredits(pkg.id);
                  setIsDialogOpen(false);
                }}
                disabled={isPurchasing}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">{pkg.price}</span>
                  <Badge variant="secondary">{pkg.amount} credits</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{pkg.description}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
