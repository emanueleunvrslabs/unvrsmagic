import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRightLeft, Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  state: string;
}

export default function FinanceTransfers() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  
  // Transfer form state
  const [sourceAccount, setSourceAccount] = useState<string>("");
  const [targetAccount, setTargetAccount] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");

  const fetchAccounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('revolut-business-api', {
        body: { action: 'getAccounts' }
      });

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      setAccounts(response.data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const handleTransfer = async () => {
    if (!sourceAccount || !targetAccount || !amount) {
      toast.error("Please fill all required fields");
      return;
    }

    if (sourceAccount === targetAccount) {
      toast.error("Source and target accounts must be different");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const sourceAcc = accounts.find(a => a.id === sourceAccount);
    if (!sourceAcc) {
      toast.error("Source account not found");
      return;
    }

    setTransferring(true);

    try {
      const response = await supabase.functions.invoke('revolut-business-api', {
        body: {
          action: 'createTransfer',
          params: {
            source_account_id: sourceAccount,
            target_account_id: targetAccount,
            amount: Math.round(numAmount * 100), // Convert to cents
            currency: sourceAcc.currency,
            reference: reference || 'Internal transfer',
          }
        }
      });

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      toast.success("Transfer completed successfully!");
      
      // Reset form
      setAmount("");
      setReference("");
      
      // Refresh accounts
      await fetchAccounts();
    } catch (err) {
      console.error('Error creating transfer:', err);
      toast.error("Failed to complete transfer");
    } finally {
      setTransferring(false);
    }
  };

  const sourceAccountData = accounts.find(a => a.id === sourceAccount);
  const targetAccountData = accounts.find(a => a.id === targetAccount);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Transfers</h1>
            <p className="text-white/60 text-sm">Move funds between your Revolut accounts</p>
          </div>
          <Button 
            onClick={fetchAccounts} 
            variant="outline" 
            className="bg-white/5 border-white/10 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transfer Form */}
          <div 
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-white font-medium">Internal Transfer</h2>
                <p className="text-white/60 text-sm">Between your accounts</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Source Account */}
              <div className="space-y-2">
                <Label className="text-white/80">From Account</Label>
                <Select value={sourceAccount} onValueChange={setSourceAccount}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.state === 'active').map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name || account.currency} - {formatCurrency(account.balance, account.currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Account */}
              <div className="space-y-2">
                <Label className="text-white/80">To Account</Label>
                <Select value={targetAccount} onValueChange={setTargetAccount}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select target account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.state === 'active' && a.id !== sourceAccount).map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name || account.currency} - {formatCurrency(account.balance, account.currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-white/80">Amount {sourceAccountData?.currency && `(${sourceAccountData.currency})`}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label className="text-white/80">Reference (optional)</Label>
                <Input
                  type="text"
                  placeholder="Internal transfer"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {/* Transfer Button */}
              <Button 
                onClick={handleTransfer}
                disabled={transferring || !sourceAccount || !targetAccount || !amount}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
              >
                {transferring ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Transfer Funds
              </Button>
            </div>
          </div>

          {/* Transfer Preview */}
          <div 
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            }}
          >
            <h2 className="text-white font-medium mb-6">Transfer Preview</h2>

            {sourceAccountData && targetAccountData && amount ? (
              <div className="space-y-6">
                {/* From */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">From</p>
                  <p className="text-white font-medium">{sourceAccountData.name || sourceAccountData.currency}</p>
                  <p className="text-white/60 text-sm">
                    Available: {formatCurrency(sourceAccountData.balance, sourceAccountData.currency)}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                  </div>
                </div>

                {/* To */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">To</p>
                  <p className="text-white font-medium">{targetAccountData.name || targetAccountData.currency}</p>
                  <p className="text-white/60 text-sm">
                    Current: {formatCurrency(targetAccountData.balance, targetAccountData.currency)}
                  </p>
                </div>

                {/* Amount */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-500/20">
                  <p className="text-white/60 text-sm mb-1">Amount to transfer</p>
                  <p className="text-2xl font-semibold text-white">
                    {sourceAccountData.currency} {parseFloat(amount || '0').toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-white/40">
                <ArrowRightLeft className="h-12 w-12 mb-4" />
                <p>Select accounts and enter amount</p>
                <p className="text-sm">to preview your transfer</p>
              </div>
            )}
          </div>
        </div>

        {/* Accounts Overview */}
        <div 
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white font-medium">Your Accounts</h2>
          </div>
          <div className="divide-y divide-white/10">
            {accounts.filter(a => a.state === 'active').map(account => (
              <div key={account.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{account.name || account.currency}</p>
                  <p className="text-white/60 text-sm">{account.currency} Account</p>
                </div>
                <p className="text-white font-medium">
                  {formatCurrency(account.balance, account.currency)}
                </p>
              </div>
            ))}
            {accounts.filter(a => a.state === 'active').length === 0 && (
              <div className="p-8 text-center text-white/60">
                No active accounts found
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
