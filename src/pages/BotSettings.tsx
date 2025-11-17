import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export const metadata = {
  title: "Bot Settings | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

export default function BotSettingsPage() {
  const [isActive, setIsActive] = useState(false);
  const [autoRestart, setAutoRestart] = useState(true);
  const [strategy, setStrategy] = useState("dca");
  const [maxTrades, setMaxTrades] = useState("10");
  const [tradeAmount, setTradeAmount] = useState("100");
  const [stopLoss, setStopLoss] = useState("5");
  const [takeProfit, setTakeProfit] = useState("10");
  const [interval, setInterval] = useState("1h");

  const handleSave = () => {
    toast.success("Bot settings saved successfully");
  };

  const handleReset = () => {
    setIsActive(false);
    setAutoRestart(true);
    setStrategy("dca");
    setMaxTrades("10");
    setTradeAmount("100");
    setStopLoss("5");
    setTakeProfit("10");
    setInterval("1h");
    toast.info("Settings reset to default");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bot Settings</h1>
          <p className="text-muted-foreground">Configure your trading bot parameters</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Changes to bot settings will take effect after saving and restarting the bot.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic bot configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="bot-active">Bot Active</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable the trading bot</p>
                  </div>
                  <Switch id="bot-active" checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-restart">Auto Restart</Label>
                    <p className="text-sm text-muted-foreground">Automatically restart bot on error</p>
                  </div>
                  <Switch id="auto-restart" checked={autoRestart} onCheckedChange={setAutoRestart} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="strategy">Trading Strategy</Label>
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger id="strategy">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dca">DCA (Dollar Cost Averaging)</SelectItem>
                      <SelectItem value="grid">Grid Trading</SelectItem>
                      <SelectItem value="arbitrage">Arbitrage</SelectItem>
                      <SelectItem value="ai">AI-Powered</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Choose the trading strategy for your bot</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Trading Interval</Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger id="interval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">How often the bot checks for trading opportunities</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trading" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Parameters</CardTitle>
                <CardDescription>Configure trading limits and amounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="max-trades">Maximum Concurrent Trades</Label>
                  <Input
                    id="max-trades"
                    type="number"
                    value={maxTrades}
                    onChange={(e) => setMaxTrades(e.target.value)}
                    placeholder="10"
                  />
                  <p className="text-sm text-muted-foreground">Maximum number of trades the bot can execute simultaneously</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="trade-amount">Trade Amount (USDT)</Label>
                  <Input
                    id="trade-amount"
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="100"
                  />
                  <p className="text-sm text-muted-foreground">Amount to use per trade in USDT</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                    <Input
                      id="stop-loss"
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="take-profit">Take Profit (%)</Label>
                    <Input
                      id="take-profit"
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>Configure risk parameters and safety limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="max-loss">Maximum Daily Loss (%)</Label>
                  <Input id="max-loss" type="number" placeholder="10" />
                  <p className="text-sm text-muted-foreground">Stop trading if daily loss exceeds this percentage</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="max-drawdown">Maximum Drawdown (%)</Label>
                  <Input id="max-drawdown" type="number" placeholder="20" />
                  <p className="text-sm text-muted-foreground">Maximum acceptable portfolio drawdown</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="risk-per-trade">Risk Per Trade (%)</Label>
                  <Input id="risk-per-trade" type="number" placeholder="2" />
                  <p className="text-sm text-muted-foreground">Percentage of portfolio to risk per trade</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
