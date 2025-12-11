import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Wallet, ArrowUpRight, ArrowDownLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  state: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  type: string;
  state: string;
  created_at: string;
  completed_at?: string;
  reference?: string;
  legs: Array<{
    leg_id: string;
    amount: number;
    currency: string;
    description?: string;
    account_id: string;
  }>;
  merchant?: {
    name: string;
    category_code: string;
  };
}

interface MerchantOrder {
  id: string;
  public_id: string;
  type: string;
  state: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  order_amount: {
    value: number;
    currency: string;
  };
  merchant_order_ext_ref?: string;
  customer_email?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export default function FinanceDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please log in to view finance data");
        return;
      }

      // Fetch accounts
      const accountsResponse = await supabase.functions.invoke('revolut-business-api', {
        body: { action: 'getAccounts' }
      });

      if (accountsResponse.error) {
        throw new Error(accountsResponse.error.message);
      }

      if (accountsResponse.data?.error) {
        throw new Error(accountsResponse.data.error);
      }

      setAccounts(accountsResponse.data || []);

      // Fetch recent transactions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transactionsResponse = await supabase.functions.invoke('revolut-business-api', {
        body: { 
          action: 'getTransactions',
          params: {
            from: thirtyDaysAgo.toISOString(),
            count: 10
          }
        }
      });

      if (transactionsResponse.data && !transactionsResponse.data.error) {
        setTransactions(transactionsResponse.data || []);
      }

      // Fetch merchant orders (payments received)
      const merchantResponse = await supabase.functions.invoke('revolut-business-api', {
        body: { 
          action: 'getMerchantOrders',
          params: {
            limit: 20
          }
        }
      });

      console.log('Merchant response:', merchantResponse);

      if (merchantResponse.data && !merchantResponse.data.error) {
        // Handle both array and paginated response structures
        const orders = Array.isArray(merchantResponse.data) 
          ? merchantResponse.data 
          : merchantResponse.data.orders || [];
        console.log('Merchant orders:', orders);
        setMerchantOrders(orders);
      }

    } catch (err: any) {
      console.error('Error fetching finance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    toast.success("Data refreshed");
  };

  const formatCurrency = (amount: number, currency: string, isMinorUnits = true) => {
    // Revolut Business API: Account balances are in major units
    // Transaction leg amounts are in major units
    // Merchant order amounts are in minor units (cents)
    const displayAmount = isMinorUnits ? amount / 100 : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(displayAmount);
  };

  const getTotalBalance = () => {
    // Group by currency
    const byCurrency: Record<string, number> = {};
    accounts.forEach(acc => {
      if (acc.state === 'active') {
        byCurrency[acc.currency] = (byCurrency[acc.currency] || 0) + acc.balance;
      }
    });
    return byCurrency;
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'transfer' || type === 'card_payment') {
      return <ArrowUpRight className="h-4 w-4 text-red-400" />;
    }
    return <ArrowDownLeft className="h-4 w-4 text-green-400" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="glassmorphism-card p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Unable to load finance data</h2>
            <p className="text-white/60 mb-4">{error}</p>
            {error.includes('Not authorized') || error.includes('not connected') ? (
              <Link to="/settings?tab=security">
                <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                  Connect Revolut Business
                </Button>
              </Link>
            ) : (
              <Button onClick={handleRefresh} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalBalances = getTotalBalance();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Finance Dashboard</h1>
            <p className="text-white/60 text-sm">Revolut Business account overview</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="bg-white/5 border-white/10 hover:bg-white/10"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(totalBalances).map(([currency, amount]) => (
            <div 
              key={currency} 
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Balance</p>
                  <p className="text-xs text-white/40">{currency}</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(amount, currency, false)}
              </p>
            </div>
          ))}

          {accounts.length === 0 && (
            <div 
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 col-span-full text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              }}
            >
              <Wallet className="h-12 w-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">No accounts found</p>
            </div>
          )}
        </div>

        {/* Accounts Grid */}
        {accounts.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div 
                  key={account.id} 
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">{account.name || account.currency}</span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      account.state === 'active' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {account.state}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(account.balance, account.currency, false)}
                  </p>
                  <p className="text-white/40 text-xs mt-2">
                    Updated: {format(new Date(account.updated_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Recent Transactions</h2>
            <Link to="/admin/finance/transactions">
              <Button variant="link" className="text-white/60 hover:text-white p-0">
                View All →
              </Button>
            </Link>
          </div>
          
          <div 
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl divide-y divide-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            }}
          >
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white/60">No recent transactions</p>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => {
                const leg = tx.legs?.[0];
                if (!leg) return null;
                
                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {tx.merchant?.name || leg.description || tx.type}
                        </p>
                        <p className="text-white/40 text-xs">
                          {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${leg.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(leg.amount, leg.currency, false)}
                      </p>
                      <p className="text-white/40 text-xs capitalize">{tx.state}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Merchant Payments (Credit Purchases) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Merchant Payments</h2>
            <span className="text-white/40 text-sm">Credit purchases from users</span>
          </div>
          
          <div 
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl divide-y divide-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            }}
          >
            {merchantOrders.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="h-12 w-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60">No merchant payments yet</p>
              </div>
            ) : (
              merchantOrders.slice(0, 10).map((order: any) => {
                // Handle different API response structures
                const amount = order.order_amount?.value ?? order.amount ?? 0;
                const currency = order.order_amount?.currency ?? order.currency ?? 'EUR';
                const state = order.state || order.status || 'unknown';
                
                return (
                  <div key={order.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {order.description || order.metadata?.package_id || 'Credit Purchase'}
                        </p>
                        <p className="text-white/40 text-xs">
                          {order.customer_email || order.merchant_order_ext_ref?.split('_')[1]?.slice(0, 8) || 'Unknown'}
                          {' · '}
                          {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-400">
                        {formatCurrency(amount, currency, true)}
                      </p>
                      <p className={`text-xs capitalize ${
                        state === 'COMPLETED' || state === 'completed' ? 'text-green-400' : 
                        state === 'PENDING' || state === 'pending' ? 'text-yellow-400' : 'text-white/40'
                      }`}>
                        {state.toLowerCase()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
