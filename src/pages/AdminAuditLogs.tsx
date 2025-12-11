import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Loader2, Search, Calendar, RefreshCw, Database, User, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

const AUDITED_TABLES = [
  "all",
  "user_credits",
  "credit_transactions",
  "clients",
  "client_contacts",
  "user_roles",
  "marketplace_projects",
  "api_keys"
];

const ACTIONS = ["all", "INSERT", "UPDATE", "DELETE"];

const AdminAuditLogs = () => {
  const { isOwner, loading: loadingRole } = useUserRole();
  
  const [tableFilter, setTableFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: auditLogs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-logs', tableFilter, actionFilter, userIdFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (tableFilter !== "all") {
        query = query.eq('table_name', tableFilter);
      }

      if (actionFilter !== "all") {
        query = query.eq('action', actionFilter);
      }

      if (userIdFilter.trim()) {
        query = query.eq('user_id', userIdFilter.trim());
      }

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00Z`);
      }

      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59Z`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as AuditLog[];
    },
    enabled: isOwner
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['audit-logs-stats'],
    queryFn: async () => {
      const { count: totalCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      return {
        total: totalCount || 0,
        today: todayCount || 0
      };
    },
    enabled: isOwner
  });

  const resetFilters = () => {
    setTableFilter("all");
    setActionFilter("all");
    setUserIdFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatData = (data: Record<string, unknown> | null) => {
    if (!data) return '-';
    const keys = Object.keys(data).slice(0, 3);
    return keys.map(k => `${k}: ${String(data[k]).slice(0, 20)}`).join(', ') + (Object.keys(data).length > 3 ? '...' : '');
  };

  if (loadingRole) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isOwner) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Audit Logs</h1>
              <p className="text-muted-foreground">Security monitoring and activity tracking</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats?.today || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored Tables</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{AUDITED_TABLES.length - 1}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Table</label>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDITED_TABLES.map(table => (
                      <SelectItem key={table} value={table}>
                        {table === 'all' ? 'All Tables' : table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map(action => (
                      <SelectItem key={action} value={action}>
                        {action === 'all' ? 'All Actions' : action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter by user ID"
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-background/50 border-border/50 [color-scheme:dark] h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-background/50 border-border/50 [color-scheme:dark] h-9 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Audit Events</CardTitle>
            <CardDescription>
              Showing {auditLogs?.length || 0} most recent events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.table_name}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate font-mono text-xs">
                          {log.user_id || 'system'}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate font-mono text-xs">
                          {log.record_id || '-'}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground">
                          {log.action === 'DELETE' 
                            ? formatData(log.old_data as Record<string, unknown>)
                            : formatData(log.new_data as Record<string, unknown>)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No audit logs found</p>
                <p className="text-sm text-muted-foreground">
                  {tableFilter !== 'all' || actionFilter !== 'all' || userIdFilter || dateFrom || dateTo
                    ? 'Try adjusting your filters'
                    : 'Audit events will appear here as they occur'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAuditLogs;
