import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Package, TrendingUp, Image, Video, Loader2, Coins, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  // Fetch total projects count
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['admin-projects-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('marketplace_projects')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch active users count
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch content generated stats
  const { data: contentStats, isLoading: loadingContent } = useQuery({
    queryKey: ['admin-content-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_social_content')
        .select('type, status, created_at');
      
      if (error) throw error;
      
      const images = data?.filter(c => c.type === 'image' && c.status === 'completed').length || 0;
      const videos = data?.filter(c => c.type === 'video' && c.status === 'completed').length || 0;
      const total = images + videos;
      
      return { images, videos, total };
    }
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_social_content')
        .select('id, type, title, status, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch workflows count
  const { data: workflowsCount, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['admin-workflows-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ai_social_workflows')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch credit statistics
  const { data: creditStats, isLoading: loadingCredits } = useQuery({
    queryKey: ['admin-credit-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance, total_purchased, total_spent');
      
      if (error) throw error;
      
      const totalBalance = data?.reduce((sum, u) => sum + Number(u.balance || 0), 0) || 0;
      const totalPurchased = data?.reduce((sum, u) => sum + Number(u.total_purchased || 0), 0) || 0;
      const totalSpent = data?.reduce((sum, u) => sum + Number(u.total_spent || 0), 0) || 0;
      
      return { totalBalance, totalPurchased, totalSpent };
    }
  });

  // Fetch credit transactions (excluding owner/admin, with scroll)
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      // First get owner/admin user IDs
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['owner', 'admin']);
      
      const adminUserIds = adminUsers?.map(u => u.user_id) || [];
      
      // Then fetch all transactions excluding admin users (no limit for scroll)
      const query = supabase
        .from('credit_transactions')
        .select('id, amount, type, description, created_at, user_id')
        .order('created_at', { ascending: false });
      
      // Only apply filter if there are admin users
      if (adminUserIds.length > 0) {
        query.not('user_id', 'in', `(${adminUserIds.join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch monthly spending data for chart
  const { data: monthlySpending, isLoading: loadingMonthly } = useQuery({
    queryKey: ['admin-monthly-spending'],
    queryFn: async () => {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('amount, created_at')
        .lt('amount', 0)
        .gte('created_at', sixMonthsAgo.toISOString());
      
      if (error) throw error;
      
      // Group by month
      const monthlyData: Record<string, number> = {};
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const key = format(month, 'MMM yyyy', { locale: it });
        monthlyData[key] = 0;
      }
      
      // Sum spending per month
      data?.forEach(tx => {
        const month = format(new Date(tx.created_at), 'MMM yyyy', { locale: it });
        if (monthlyData[month] !== undefined) {
          monthlyData[month] += Math.abs(Number(tx.amount));
        }
      });
      
      return Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount: Number(amount.toFixed(2))
      }));
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingProjects ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{projectsData}</div>
                  <p className="text-xs text-muted-foreground">
                    Projects in marketplace
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Registered Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{usersData}</div>
                  <p className="text-xs text-muted-foreground">
                    Total platform users
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Content Generated
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingContent ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{contentStats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {contentStats?.images || 0} images, {contentStats?.videos || 0} videos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Workflows
              </CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingWorkflows ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{workflowsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Automated workflows
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Credit Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Credits Purchased
              </CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingCredits ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">€{creditStats?.totalPurchased?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    Total revenue from credits
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Credits Spent
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingCredits ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">€{creditStats?.totalSpent?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    Used for content generation
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingCredits ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-500">€{creditStats?.totalBalance?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    Total unused credits
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Spending Chart */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Credits Spent per Month</CardTitle>
              <CardDescription>Last 6 months spending overview</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMonthly ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : monthlySpending && monthlySpending.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySpending}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        tickFormatter={(value) => `€${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spent']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        fillOpacity={0.6}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No spending data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Credit purchases and usage history</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : transactionsData && transactionsData.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsData.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {Number(tx.amount) > 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                              )}
                              <Badge variant={tx.type === 'purchase' ? 'default' : 'secondary'}>
                                {tx.type === 'purchase' ? 'Purchase' : 'Usage'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {tx.description || '-'}
                          </TableCell>
                          <TableCell>
                            <span className={Number(tx.amount) > 0 ? 'text-green-500' : 'text-red-500'}>
                              {Number(tx.amount) > 0 ? '+' : ''}€{Number(tx.amount).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: it })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transactions yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Recent Content</CardTitle>
              <CardDescription>Latest generated images and videos</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {item.type === 'image' ? (
                          <Image className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Video className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type === 'image' ? 'Image' : 'Video'} • {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', { locale: it })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No content generated yet
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a href="/admin/projects" className="block p-3 rounded-lg hover:bg-muted transition-colors">
                  <p className="text-sm font-medium">Manage Projects</p>
                  <p className="text-xs text-muted-foreground">View and configure all projects</p>
                </a>
                <a href="/marketplace" className="block p-3 rounded-lg hover:bg-muted transition-colors">
                  <p className="text-sm font-medium">View Marketplace</p>
                  <p className="text-xs text-muted-foreground">Check available projects</p>
                </a>
                <a href="/settings" className="block p-3 rounded-lg hover:bg-muted transition-colors">
                  <p className="text-sm font-medium">Platform Settings</p>
                  <p className="text-xs text-muted-foreground">Configure API keys and security</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
