import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Plus, Image, Video, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

const CREDIT_PACKAGES = [
  { id: "credits_10", amount: 10, price: "€10", description: "10 images or 1 video" },
  { id: "credits_50", amount: 50, price: "€50", description: "50 images or 5 videos" },
  { id: "credits_100", amount: 100, price: "€100", description: "100 images or 10 videos" },
  { id: "credits_250", amount: 250, price: "€250", description: "250 images or 25 videos" },
  { id: "credits_500", amount: 500, price: "€500", description: "500 images or 50 videos" },
  { id: "credits_1000", amount: 1000, price: "€1000", description: "1000 images or 100 videos" },
];

export function CreditBalanceCard() {
  const { credits, transactions, isLoading, purchaseCredits, isPurchasing } = useUserCredits();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Credit Balance</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Credits
              </Button>
            </DialogTrigger>
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
                    onClick={() => purchaseCredits(pkg.id)}
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
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-xs font-medium text-amber-400">Pricing</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Image className="h-3 w-3" /> €1/image
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" /> €10/video
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>Your available credits for content generation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{formatCurrency(credits?.balance || 0)}</span>
          <span className="text-sm text-muted-foreground">available</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-green-500/10 p-1.5">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Purchased</p>
              <p className="text-sm font-medium">{formatCurrency(credits?.total_purchased || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-red-500/10 p-1.5">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-sm font-medium">{formatCurrency(credits?.total_spent || 0)}</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Recent Transactions</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {tx.type === "purchase" ? (
                        <Plus className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-red-500/20" />
                      )}
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        {tx.description || tx.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                        {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
