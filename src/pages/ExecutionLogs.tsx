import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Filter, TrendingUp, TrendingDown, CheckCircle, XCircle, Clock } from "lucide-react";

export const metadata = {
  title: "Execution Logs | DefibotX",
  description: "Advanced AI-powered trading bot for cryptocurrency markets",
};

type LogEntry = {
  id: string;
  timestamp: string;
  type: "buy" | "sell";
  pair: string;
  amount: string;
  price: string;
  total: string;
  status: "completed" | "failed" | "pending";
  pnl?: string;
};

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2024-11-17 02:15:23",
    type: "buy",
    pair: "BTC/USDT",
    amount: "0.005",
    price: "43,250",
    total: "216.25",
    status: "completed",
    pnl: "+5.2%",
  },
  {
    id: "2",
    timestamp: "2024-11-17 01:45:10",
    type: "sell",
    pair: "ETH/USDT",
    amount: "0.15",
    price: "2,280",
    total: "342.00",
    status: "completed",
    pnl: "+3.8%",
  },
  {
    id: "3",
    timestamp: "2024-11-17 01:30:05",
    type: "buy",
    pair: "SOL/USDT",
    amount: "5.0",
    price: "98.50",
    total: "492.50",
    status: "completed",
    pnl: "-1.2%",
  },
  {
    id: "4",
    timestamp: "2024-11-17 01:00:12",
    type: "buy",
    pair: "BNB/USDT",
    amount: "2.5",
    price: "315.20",
    total: "788.00",
    status: "pending",
  },
  {
    id: "5",
    timestamp: "2024-11-17 00:45:33",
    type: "sell",
    pair: "ADA/USDT",
    amount: "1000",
    price: "0.45",
    total: "450.00",
    status: "failed",
  },
];

export default function ExecutionLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "failed" | "pending">("all");

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = log.pair.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || log.type === filterType;
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      failed: "destructive",
      pending: "secondary",
    };
    return (
      <Badge variant={variants[status] || "default"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "buy" ? (
      <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
        <TrendingUp className="mr-1 h-3 w-3" />
        Buy
      </Badge>
    ) : (
      <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
        <TrendingDown className="mr-1 h-3 w-3" />
        Sell
      </Badge>
    );
  };

  const getPnLColor = (pnl?: string) => {
    if (!pnl) return "text-muted-foreground";
    return pnl.startsWith("+") ? "text-green-500" : "text-red-500";
  };

  const handleExport = () => {
    console.log("Exporting logs...");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Execution Logs</h1>
            <p className="text-muted-foreground">View and analyze your bot trading history</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
            <CardDescription>All bot executions and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by trading pair..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total (USDT)</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.timestamp}</TableCell>
                        <TableCell>{getTypeBadge(log.type)}</TableCell>
                        <TableCell className="font-semibold">{log.pair}</TableCell>
                        <TableCell className="text-right">{log.amount}</TableCell>
                        <TableCell className="text-right">${log.price}</TableCell>
                        <TableCell className="text-right font-medium">${log.total}</TableCell>
                        <TableCell className={`text-right font-semibold ${getPnLColor(log.pnl)}`}>
                          {log.pnl || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No execution logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockLogs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {mockLogs.filter((l) => l.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {mockLogs.filter((l) => l.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {mockLogs.filter((l) => l.status === "failed").length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
