import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Connection() {
  const [isOwner, setIsOwner] = useState(false);
  const [instagramAppId, setInstagramAppId] = useState("");
  const [instagramSecret, setInstagramSecret] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    checkUserRole();
    checkCredentials();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .single();

    setIsOwner(!!data);
  };

  const checkCredentials = async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .eq("provider", "instagram_app_credentials")
      .single();

    if (data) {
      setHasCredentials(true);
      setInstagramAppId(data.api_key);
    }
  };

  const saveCredentials = async () => {
    if (!instagramAppId || !instagramSecret) {
      toast.error("Please fill in both App ID and Secret");
      return;
    }

    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first");
        return;
      }

      const { error } = await supabase.from("api_keys").upsert({
        user_id: user.id,
        provider: "instagram_app_credentials",
        api_key: instagramAppId,
        owner_id: instagramSecret
      }, { onConflict: "user_id,provider" });

      if (error) throw error;

      toast.success("Instagram app credentials saved");
      setHasCredentials(true);
    } catch (error) {
      console.error("Error saving credentials:", error);
      toast.error("Failed to save credentials");
    } finally {
      setIsConnecting(false);
    }
  };

  const connectInstagram = async () => {
    if (!hasCredentials) {
      toast.error("Instagram app not configured. Contact administrator.");
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('instagram-oauth', {
        body: {},
        method: 'GET',
      });

      if (error) throw error;

      if (data.authUrl) {
        // Redirect to Instagram OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error starting OAuth:", error);
      toast.error("Failed to connect Instagram");
    }
  };

  useEffect(() => {
    // Check if redirected back from OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("Instagram connected successfully!");
      window.history.replaceState({}, '', '/ai-social/connection');
      checkCredentials();
    }
  }, []);
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
          {isOwner && (
            <Card className="md:col-span-2 mb-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Meta App Configuration</CardTitle>
                </div>
                <CardDescription>Insert your Meta App credentials for Instagram OAuth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram-app-id">App ID</Label>
                  <Input
                    id="instagram-app-id"
                    type="text"
                    placeholder="Enter your Meta App ID"
                    value={instagramAppId}
                    onChange={(e) => setInstagramAppId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram-secret">App Secret</Label>
                  <Input
                    id="instagram-secret"
                    type="password"
                    placeholder="Enter your Meta App Secret"
                    value={instagramSecret}
                    onChange={(e) => setInstagramSecret(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={saveCredentials}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Saving..." : "Save Credentials"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Instagram</CardTitle>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <CardDescription>Connect your Instagram account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={connectInstagram}
                disabled={!hasCredentials}
              >
                <Link className="mr-2 h-4 w-4" />
                Connect Instagram
              </Button>
              {!hasCredentials && !isOwner && (
                <p className="text-sm text-muted-foreground mt-2">
                  Instagram connection not available. Contact administrator.
                </p>
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
