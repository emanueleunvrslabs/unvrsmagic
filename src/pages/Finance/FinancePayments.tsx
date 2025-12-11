import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Plus, Users, Loader2 } from "lucide-react";

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface Counterparty {
  id: string;
  name: string;
  bank_country: string;
  currency: string;
  accounts?: {
    id: string;
    currency: string;
    type: string;
    iban?: string;
    bic?: string;
  }[];
}

export default function FinancePayments() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creatingCounterparty, setCreatingCounterparty] = useState(false);
  const [showNewCounterparty, setShowNewCounterparty] = useState(false);

  // Payment form
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedCounterparty, setSelectedCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  // New counterparty form
  const [newCounterparty, setNewCounterparty] = useState({
    name: "",
    bank_country: "IT",
    currency: "EUR",
    iban: "",
    bic: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      // Load accounts and counterparties in parallel
      const [accountsRes, counterpartiesRes] = await Promise.all([
        supabase.functions.invoke('revolut-business-api', {
          body: { action: 'getAccounts', params: {} }
        }),
        supabase.functions.invoke('revolut-business-api', {
          body: { action: 'getCounterparties', params: {} }
        })
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (counterpartiesRes.error) throw counterpartiesRes.error;

      setAccounts(accountsRes.data || []);
      setCounterparties(counterpartiesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCounterparty = async () => {
    if (!newCounterparty.name || !newCounterparty.iban) {
      toast.error("Name and IBAN are required");
      return;
    }

    setCreatingCounterparty(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('revolut-business-api', {
        body: {
          action: 'createCounterparty',
          params: {
            counterparty: {
              company_name: newCounterparty.name,
              bank_country: newCounterparty.bank_country,
              currency: newCounterparty.currency,
              iban: newCounterparty.iban,
              bic: newCounterparty.bic || undefined,
            }
          }
        }
      });

      if (error) throw error;

      toast.success("Counterparty created successfully");
      setShowNewCounterparty(false);
      setNewCounterparty({
        name: "",
        bank_country: "IT",
        currency: "EUR",
        iban: "",
        bic: "",
      });
      loadData();
    } catch (error) {
      console.error('Error creating counterparty:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create counterparty");
    } finally {
      setCreatingCounterparty(false);
    }
  };

  const handleSendPayment = async () => {
    if (!selectedAccount || !selectedCounterparty || !amount) {
      toast.error("Please fill all required fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount");
      return;
    }

    const account = accounts.find(a => a.id === selectedAccount);
    const counterparty = counterparties.find(c => c.id === selectedCounterparty);

    if (!account || !counterparty) {
      toast.error("Invalid selection");
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const counterpartyAccount = counterparty.accounts?.[0];

      const { data, error } = await supabase.functions.invoke('revolut-business-api', {
        body: {
          action: 'createPayment',
          params: {
            account_id: selectedAccount,
            receiver: {
              counterparty_id: selectedCounterparty,
              account_id: counterpartyAccount?.id,
            },
            amount: amountNum,
            currency: account.currency,
            reference: reference || `Payment to ${counterparty.name}`,
          }
        }
      });

      if (error) throw error;

      toast.success(`Payment of ${amountNum} ${account.currency} sent to ${counterparty.name}`);
      setAmount("");
      setReference("");
      setSelectedCounterparty("");
      loadData();
    } catch (error) {
      console.error('Error sending payment:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send payment");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">External Payments</h1>
        <Button
          variant="outline"
          onClick={() => setShowNewCounterparty(!showNewCounterparty)}
          className="bg-transparent border-white/10 hover:bg-white/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Counterparty
        </Button>
      </div>

      {/* New Counterparty Form */}
      {showNewCounterparty && (
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' }}
        >
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add New Counterparty
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Company / Person Name *</Label>
              <Input
                value={newCounterparty.name}
                onChange={(e) => setNewCounterparty({ ...newCounterparty, name: e.target.value })}
                placeholder="ACME Corp"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>IBAN *</Label>
              <Input
                value={newCounterparty.iban}
                onChange={(e) => setNewCounterparty({ ...newCounterparty, iban: e.target.value.toUpperCase() })}
                placeholder="IT60X0542811101000000123456"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>BIC / SWIFT (optional)</Label>
              <Input
                value={newCounterparty.bic}
                onChange={(e) => setNewCounterparty({ ...newCounterparty, bic: e.target.value.toUpperCase() })}
                placeholder="BPPIITRRXXX"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Country</Label>
              <Select
                value={newCounterparty.bank_country}
                onValueChange={(v) => setNewCounterparty({ ...newCounterparty, bank_country: v })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">Italy</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="ES">Spain</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="NL">Netherlands</SelectItem>
                  <SelectItem value="BE">Belgium</SelectItem>
                  <SelectItem value="AT">Austria</SelectItem>
                  <SelectItem value="PT">Portugal</SelectItem>
                  <SelectItem value="CH">Switzerland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={newCounterparty.currency}
                onValueChange={(v) => setNewCounterparty({ ...newCounterparty, currency: v })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreateCounterparty}
                disabled={creatingCounterparty}
                className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/30"
              >
                {creatingCounterparty ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Counterparty
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Payment Form */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' }}
      >
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Payment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>From Account *</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.balance.toLocaleString()} {account.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To Counterparty *</Label>
            <Select value={selectedCounterparty} onValueChange={setSelectedCounterparty}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select counterparty" />
              </SelectTrigger>
              <SelectContent>
                {counterparties.length === 0 ? (
                  <SelectItem value="none" disabled>No counterparties - add one first</SelectItem>
                ) : (
                  counterparties.map((cp) => (
                    <SelectItem key={cp.id} value={cp.id}>
                      {cp.name} ({cp.currency})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label>Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Invoice #123"
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>

        <Button
          onClick={handleSendPayment}
          disabled={sending || !selectedAccount || !selectedCounterparty || !amount}
          className="mt-4 bg-primary/20 hover:bg-primary/30 border border-primary/30"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Payment
        </Button>
      </div>

      {/* Counterparties List */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' }}
      >
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Saved Counterparties
        </h2>
        {counterparties.length === 0 ? (
          <p className="text-muted-foreground">No counterparties yet. Add one to start sending payments.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {counterparties.map((cp) => (
              <div
                key={cp.id}
                className="p-4 rounded-xl border border-white/10 bg-white/5"
              >
                <h3 className="font-medium">{cp.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {cp.bank_country} • {cp.currency}
                </p>
                {cp.accounts?.[0]?.iban && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {cp.accounts[0].iban}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
