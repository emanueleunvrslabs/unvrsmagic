import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video, Zap, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ContentGallerySection } from "@/components/ai-social/ContentGallerySection";
import { useQuery } from "@tanstack/react-query";
import "@/components/labs/SocialMediaCard.css";

const WorkflowsList = () => {
  const { data: workflows } = useQuery({
    queryKey: ['active-workflows'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('ai_social_workflows')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const navigate = useNavigate();

  const getPlatformEmoji = (platform: string) => {
    const map: Record<string, string> = {
      instagram: "📷",
      facebook: "👍",
      twitter: "🐦",
      linkedin: "💼"
    };
    return map[platform] || "🌐";
  };

  const formatSchedule = (scheduleConfig: Record<string, unknown> | null) => {
    if (!scheduleConfig) return "";
    const frequency = scheduleConfig.frequency as string | undefined;
    const times = scheduleConfig.times as string[] | undefined;
    const days = scheduleConfig.days as string[] | undefined;
    
    if (frequency === "daily" && times) {
      return `Daily at ${times.join(", ")}`;
    } else if (frequency === "weekly" && days && times) {
      const dayNames = days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ");
      return `${dayNames} at ${times.join(", ")}`;
    }
    return frequency || "";
  };

  if (!workflows || workflows.length === 0) {
    return (
      <div className="labs-client-card rounded-[22px] p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Automated Workflows</h3>
          <p className="text-sm text-white/50 mt-1">Configure automations to generate and publish content</p>
        </div>
        <div className="text-center py-12 text-white/40">
          No active workflows
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {workflows.map((workflow) => {
        const scheduleConfig = workflow.schedule_config as any;
        const mode = scheduleConfig?.mode || "text-to-image";
        const modeLabel = mode
          .split("-")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return (
          <div key={workflow.id} className="labs-client-card rounded-[22px] p-5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate('/ai-social/workflows')}>
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1 flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  {workflow.name}
                </h3>
                <p className="text-xs text-white/50">
                  {formatSchedule(scheduleConfig)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {workflow.content_type === "image" ? "🖼️ Image" : "🎥 Video"}
                </span>
                {workflow.content_type === "image" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                    Nano 🍌
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-purple-500/10 text-purple-400 border-purple-500/20">
                    Veo3 🎬
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-slate-500/10 text-slate-400 border-slate-500/20">
                  {modeLabel}
                </span>
              </div>
              
              {workflow.platforms && workflow.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {workflow.platforms.map((platform: string) => (
                    <span key={platform} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm capitalize bg-pink-500/10 text-pink-400 border-pink-500/20">
                      {getPlatformEmoji(platform)} {platform}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function AiSocialDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalContent: 0,
    generatedImages: 0,
    generatedVideos: 0,
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
            Create AI-powered visual content for your social media
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="labs-client-card rounded-[22px] p-5">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium text-white/70">Total Content</h3>
                  <Image className="h-4 w-4 text-white/40" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalContent}</div>
                <p className="text-xs text-white/40">Images & Videos</p>
              </div>

              <div className="labs-client-card rounded-[22px] p-5">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium text-white/70">Generated Images</h3>
                  <Image className="h-4 w-4 text-white/40" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.generatedImages}</div>
                <p className="text-xs text-white/40">Total images</p>
              </div>

              <div className="labs-client-card rounded-[22px] p-5">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium text-white/70">Generated Videos</h3>
                  <Video className="h-4 w-4 text-white/40" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.generatedVideos}</div>
                <p className="text-xs text-white/40">Total videos</p>
              </div>

              <div className="labs-client-card rounded-[22px] p-5">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium text-white/70">Active Workflows</h3>
                  <Zap className="h-4 w-4 text-white/40" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.activeWorkflows}</div>
                <p className="text-xs text-white/40">Active automations</p>
              </div>
            </div>

            <div className="labs-client-card rounded-[22px] p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Get Started</h3>
                <p className="text-sm text-white/50 mt-1">Generate AI visual content for your social media</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div 
                  className="labs-client-card rounded-[18px] p-5 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => navigate('/ai-social/generate-image')}
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Generate Image
                  </h3>
                  <p className="text-sm text-white/50 mt-2">Create images with Nano Banana</p>
                </div>

                <div 
                  className="labs-client-card rounded-[18px] p-5 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => navigate('/ai-social/generate-video')}
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Generate Video
                  </h3>
                  <p className="text-sm text-white/50 mt-2">Create videos with Veo3</p>
                </div>

                <div 
                  className="labs-client-card rounded-[18px] p-5 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => navigate('/ai-social/workflows')}
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Create Workflow
                  </h3>
                  <p className="text-sm text-white/50 mt-2">Automate AI content generation</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <ContentGallerySection />
          </TabsContent>

          <TabsContent value="workflows">
            <WorkflowsList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
