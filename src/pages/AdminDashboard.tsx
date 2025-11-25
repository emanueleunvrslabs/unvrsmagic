import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Users, Package, TrendingUp, Image, Video, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview and management of the entire platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
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

          <Card>
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
