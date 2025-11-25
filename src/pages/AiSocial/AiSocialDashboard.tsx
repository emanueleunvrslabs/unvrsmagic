import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video, Calendar, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ContentGallerySection } from "@/components/ai-social/ContentGallerySection";

export default function AiSocialDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalContent: 0,
    generatedImages: 0,
    generatedVideos: 0,
    scheduledPosts: 0,
    activeWorkflows: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total content count
      const { count: totalCount } = await supabase
        .from("ai_social_content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get images count
      const { count: imagesCount } = await supabase
        .from("ai_social_content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "image");

      // Get videos count
      const { count: videosCount } = await supabase
        .from("ai_social_content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "video");

      // Get scheduled posts count
      const { count: scheduledCount } = await supabase
        .from("ai_social_scheduled_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "scheduled");

      // Get active workflows count
      const { count: workflowsCount } = await supabase
        .from("ai_social_workflows")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("active", true);

      setStats({
        totalContent: totalCount || 0,
        generatedImages: imagesCount || 0,
        generatedVideos: videosCount || 0,
        scheduledPosts: scheduledCount || 0,
        activeWorkflows: workflowsCount || 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ai Social</h1>
          <p className="text-muted-foreground mt-2">
            Create and schedule AI-powered visual content for your social media
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                  <Image className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalContent}</div>
                  <p className="text-xs text-muted-foreground">Images & Videos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Generated Images</CardTitle>
                  <Image className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.generatedImages}</div>
                  <p className="text-xs text-muted-foreground">Total images</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Generated Videos</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.generatedVideos}</div>
                  <p className="text-xs text-muted-foreground">Total videos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
                  <p className="text-xs text-muted-foreground">Next 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeWorkflows}</div>
                  <p className="text-xs text-muted-foreground">Active automations</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Generate AI visual content and schedule social media posts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/ai-social/generate-image')}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Generate Image
                      </CardTitle>
                      <CardDescription>
                        Create images with Nano Banana
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/ai-social/generate-video')}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Generate Video
                      </CardTitle>
                      <CardDescription>
                        Create videos with Veo3
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/ai-social/schedule-post')}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Schedule Post
                      </CardTitle>
                      <CardDescription>
                        Schedule content for social media
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate('/ai-social/workflows')}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Create Workflow
                      </CardTitle>
                      <CardDescription>
                        Automate AI content generation
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <ContentGallerySection />
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Posts</CardTitle>
                <CardDescription>
                  View and manage scheduled posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  No scheduled posts
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows">
            <Card>
              <CardHeader>
                <CardTitle>Automated Workflows</CardTitle>
                <CardDescription>
                  Configure automations to generate and publish content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  No workflows configured
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
