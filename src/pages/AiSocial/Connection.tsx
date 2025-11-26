import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, Unlink } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Connection() {
  const queryClient = useQueryClient();

  const { data: instagramConnection, isLoading: isLoadingInstagram } = useQuery({
    queryKey: ['instagram-connection'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('provider', 'instagram')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: youtubeConnection, isLoading: isLoadingYoutube } = useQuery({
    queryKey: ['youtube-connection'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('provider', 'youtube')
        .maybeSingle();

      if (error) throw error;
      
      // Parse the stored JSON to get channel info
      if (data?.api_key) {
        try {
          const parsed = JSON.parse(data.api_key);
          return { ...data, channelTitle: parsed.channel_title };
        } catch {
          return data;
        }
      }
      return data;
    },
  });

  const connectInstagram = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke("instagram-oauth", {
        body: {
          action: "start",
          user_id: session.user.id,
        },
      });

      console.log('Instagram OAuth response:', { data, error });

      if (error) {
        console.error("Error starting OAuth:", error);
        const errorMessage = (error as any).message || "Failed to connect Instagram";
        toast.error(errorMessage);
        return;
      }

      if (data && (data as any).error) {
        console.error("Instagram OAuth error:", (data as any).error);
        toast.error((data as any).error);
        return;
      }

      if (data && (data as any).authUrl) {
        console.log('Redirecting to Instagram:', (data as any).authUrl);
        window.location.href = (data as any).authUrl as string;
      } else {
        console.error("Invalid response:", data);
        toast.error("Invalid response from Instagram OAuth");
      }
    } catch (error) {
      console.error("Error starting OAuth:", error);
      toast.error("Failed to connect Instagram");
    }
  };

  const disconnectInstagram = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        return;
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', session.user.id)
        .eq('provider', 'instagram');

      if (error) throw error;

      toast.success("Instagram disconnected successfully!");
      queryClient.invalidateQueries({ queryKey: ['instagram-connection'] });
    } catch (error) {
      console.error("Error disconnecting Instagram:", error);
      toast.error("Failed to disconnect Instagram");
    }
  };

  const connectYoutube = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke("youtube-oauth", {
        body: {
          action: "start",
          user_id: session.user.id,
          origin: window.location.origin,
        },
      });

      console.log('YouTube OAuth response:', { data, error });

      if (error) {
        console.error("Error starting YouTube OAuth:", error);
        const errorMessage = (error as any).message || "Failed to connect YouTube";
        toast.error(errorMessage);
        return;
      }

      if (data && (data as any).error) {
        console.error("YouTube OAuth error:", (data as any).error);
        toast.error((data as any).error);
        return;
      }

      if (data && (data as any).authUrl) {
        console.log('Redirecting to YouTube:', (data as any).authUrl);
        window.location.href = (data as any).authUrl as string;
      } else {
        console.error("Invalid response:", data);
        toast.error("Invalid response from YouTube OAuth");
      }
    } catch (error) {
      console.error("Error starting YouTube OAuth:", error);
      toast.error("Failed to connect YouTube");
    }
  };

  const disconnectYoutube = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        return;
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', session.user.id)
        .eq('provider', 'youtube');

      if (error) throw error;

      toast.success("YouTube disconnected successfully!");
      queryClient.invalidateQueries({ queryKey: ['youtube-connection'] });
    } catch (error) {
      console.error("Error disconnecting YouTube:", error);
      toast.error("Failed to disconnect YouTube");
    }
  };

  useEffect(() => {
    // Check if redirected back from OAuth
    const params = new URLSearchParams(window.location.search);
    
    // Instagram callback
    if (params.get('success') === 'true') {
      toast.success("Instagram connected successfully!");
      queryClient.invalidateQueries({ queryKey: ['instagram-connection'] });
      window.history.replaceState({}, '', '/ai-social/connection');
    }
    
    // YouTube callback
    if (params.get('youtube_success') === 'true') {
      const channel = params.get('channel');
      toast.success(`YouTube connected successfully! Channel: ${channel || 'Connected'}`);
      queryClient.invalidateQueries({ queryKey: ['youtube-connection'] });
      window.history.replaceState({}, '', '/ai-social/connection');
    }
    
    // Error handling
    const error = params.get('error');
    if (error) {
      toast.error(`Connection failed: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, '', '/ai-social/connection');
    }
  }, [queryClient]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Social Media Connections</h1>
          <p className="text-muted-foreground mt-2">
            Connect your social media accounts for automated publishing
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Instagram</CardTitle>
                <Badge 
                  variant="outline"
                  className={instagramConnection ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                >
                  {instagramConnection ? "Connected" : "Not Connected"}
                </Badge>
              </div>
              <CardDescription>
                {instagramConnection 
                  ? `Connected to Instagram Business Account` 
                  : "Connect your Instagram account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {instagramConnection ? (
                <Button 
                  className="w-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 hover:border-destructive/30"
                  variant="ghost"
                  onClick={disconnectInstagram}
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Disconnect Instagram
                </Button>
              ) : (
                <Button 
                  className="w-full"
                  onClick={connectInstagram}
                  disabled={isLoadingInstagram}
                >
                  <Link className="mr-2 h-4 w-4" />
                  Connect Instagram
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>YouTube</CardTitle>
                <Badge 
                  variant="outline"
                  className={youtubeConnection ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                >
                  {youtubeConnection ? "Connected" : "Not Connected"}
                </Badge>
              </div>
              <CardDescription>
                {youtubeConnection 
                  ? `Connected to: ${(youtubeConnection as any).channelTitle || 'YouTube Channel'}` 
                  : "Connect your YouTube channel for live streaming"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {youtubeConnection ? (
                <Button 
                  className="w-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 hover:border-destructive/30"
                  variant="ghost"
                  onClick={disconnectYoutube}
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Disconnect YouTube
                </Button>
              ) : (
                <Button 
                  className="w-full"
                  onClick={connectYoutube}
                  disabled={isLoadingYoutube}
                >
                  <Link className="mr-2 h-4 w-4" />
                  Connect YouTube
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Facebook</CardTitle>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <CardDescription>Connect your Facebook page</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                <Link className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>TikTok</CardTitle>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <CardDescription>Connect your TikTok account for live streaming</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                <Link className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
