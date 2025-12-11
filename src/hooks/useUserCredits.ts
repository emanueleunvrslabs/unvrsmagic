import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  total_purchased: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "purchase" | "generation" | "refund" | "adjustment";
  description: string | null;
  content_id: string | null;
  stripe_payment_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useUserCredits() {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  const { data: credits, isLoading, error } = useQuery({
    queryKey: ["user-credits", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      // If no credits record exists, return default values
      if (!data) {
        return {
          id: "",
          user_id: userId,
          balance: 0,
          total_purchased: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserCredits;
      }

      return data as UserCredits;
    },
    enabled: !!userId,
  });

  const { data: transactions } = useQuery({
    queryKey: ["credit-transactions", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!userId,
  });

  const purchaseCreditsMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const returnUrl = `${window.location.origin}/ai-social`;
      
      // Use Revolut Merchant for payments
      const { data, error } = await supabase.functions.invoke("create-revolut-checkout", {
        body: { packageId, returnUrl },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");

      return data.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error) => {
      console.error("Purchase error:", error);
      toast.error("Errore durante l'acquisto dei crediti");
    },
  });

  const refreshCredits = () => {
    queryClient.invalidateQueries({ queryKey: ["user-credits", userId] });
    queryClient.invalidateQueries({ queryKey: ["credit-transactions", userId] });
  };

  return {
    credits,
    transactions,
    isLoading,
    error,
    purchaseCredits: purchaseCreditsMutation.mutate,
    isPurchasing: purchaseCreditsMutation.isPending,
    refreshCredits,
  };
}
