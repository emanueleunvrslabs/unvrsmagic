import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Connection() {
  const queryClient = useQueryClient();

  const { data: instagramConnection, isLoading } = useQuery({
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

  useEffect(() => {
    // Check if redirected back from OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("Instagram connected successfully!");
      queryClient.invalidateQueries({ queryKey: ['instagram-connection'] });
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
                  disabled={isLoading}
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
                <CardTitle>Facebook</CardTitle>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <CardDescription>Connect your Facebook page</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Link className="mr-2 h-4 w-4" />
                Connect Facebook
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Twitter</CardTitle>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <CardDescription>Connect your Twitter account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Link className="mr-2 h-4 w-4" />
                Connect Twitter
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>LinkedIn</CardTitle>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <CardDescription>Connect your LinkedIn profile</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Link className="mr-2 h-4 w-4" />
                Connect LinkedIn
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
