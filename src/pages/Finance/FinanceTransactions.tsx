import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Download, ArrowUpRight, ArrowDownLeft, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  type: string;
  state: string;
  created_at: string;
  completed_at?: string;
  reference?: string;
  request_id?: string;
  legs: Array<{
    leg_id: string;
    amount: number;
    currency: string;
    description?: string;
    account_id: string;
    balance?: number;
  }>;
  merchant?: {
    name: string;
    category_code: string;
    city?: string;
    country?: string;
  };
}

export default function FinanceTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const fetchTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params: any = {
        from: new Date(dateFrom).toISOString(),
        to: new Date(dateTo + 'T23:59:59').toISOString(),
        count: 1000, // Get all, we'll paginate client-side
      };

      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await supabase.functions.invoke('revolut-business-api', {
        body: { action: 'getTransactions', params }
      });

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      setTransactions(response.data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [dateFrom, dateTo, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    toast.success("Transactions refreshed");
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Currency', 'Status', 'Reference'];
    const rows = transactions.map(tx => {
      const leg = tx.legs?.[0];
      return [
        format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm:ss'),
        tx.type,
        tx.merchant?.name || leg?.description || '',
        leg ? (leg.amount / 100).toFixed(2) : '',
        leg?.currency || '',
        tx.state,
        tx.reference || ''
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const paginatedTransactions = transactions.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(transactions.length / pageSize);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Transactions</h1>
            <p className="text-white/60 text-sm">{transactions.length} transactions found</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={exportCSV} 
              variant="outline" 
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
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
        </div>

        {/* Filters */}
        <div 
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-wrap gap-4 items-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          <Filter className="h-4 w-4 text-white/60" />
          
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">From:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white/5 border-white/10 text-white w-40"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">To:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white/5 border-white/10 text-white w-40"
            />
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="card_payment">Card Payment</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
              <SelectItem value="topup">Top-up</SelectItem>
              <SelectItem value="fee">Fee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        <div 
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60 text-sm font-medium">Date</th>
                  <th className="text-left p-4 text-white/60 text-sm font-medium">Type</th>
                  <th className="text-left p-4 text-white/60 text-sm font-medium">Description</th>
                  <th className="text-right p-4 text-white/60 text-sm font-medium">Amount</th>
                  <th className="text-center p-4 text-white/60 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-white/60 text-sm font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/60">
                      No transactions found for this period
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const leg = tx.legs?.[0];
                    if (!leg) return null;
                    
                    return (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <p className="text-white text-sm">
                            {format(new Date(tx.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-white/40 text-xs">
                            {format(new Date(tx.created_at), 'HH:mm')}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                              leg.amount < 0 ? 'bg-red-500/20' : 'bg-green-500/20'
                            }`}>
                              {leg.amount < 0 
                                ? <ArrowUpRight className="h-3 w-3 text-red-400" />
                                : <ArrowDownLeft className="h-3 w-3 text-green-400" />
                              }
                            </div>
                            <span className="text-white text-sm capitalize">
                              {tx.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-white text-sm">
                            {tx.merchant?.name || leg.description || '-'}
                          </p>
                          {tx.merchant?.city && (
                            <p className="text-white/40 text-xs">
                              {tx.merchant.city}, {tx.merchant.country}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <p className={`font-medium ${leg.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {formatCurrency(leg.amount, leg.currency)}
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            tx.state === 'completed' ? 'bg-green-500/20 text-green-400' :
                            tx.state === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            tx.state === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-white/10 text-white/60'
                          }`}>
                            {tx.state}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-white/60 text-sm font-mono truncate max-w-[150px]">
                            {tx.reference || '-'}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-white/60 text-sm">
                Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, transactions.length)} of {transactions.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-white/60 text-sm px-2">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
