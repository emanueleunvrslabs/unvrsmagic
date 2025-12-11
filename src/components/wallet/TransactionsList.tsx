import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setTransactions(data as Transaction[]);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      signDisplay: "always",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="labs-client-card w-full max-w-2xl rounded-[22px] p-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="labs-client-card w-full max-w-2xl rounded-[22px] p-8">
      <h3 className="text-lg font-semibold text-white mb-6">Transaction History</h3>
      
      {transactions.length === 0 ? (
        <p className="text-white/50 text-center py-8">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.type === "purchase"
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-red-500/20 border border-red-500/30"
                }`}
              >
                {tx.type === "purchase" ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-400" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {tx.description || (tx.type === "purchase" ? "Credit Purchase" : "Credit Usage")}
                </p>
                <p className="text-white/40 text-sm">
                  {format(new Date(tx.created_at), "MMM d, yyyy 'at' HH:mm")}
                </p>
              </div>
              
              <span
                className={`text-lg font-semibold ${
                  tx.amount > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
