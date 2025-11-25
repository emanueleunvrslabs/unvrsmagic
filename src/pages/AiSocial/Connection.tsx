import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Connection() {
  const [instagramAppId, setInstagramAppId] = useState("");
  const [instagramSecret, setInstagramSecret] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
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
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <CardDescription>Connect your Instagram account via Meta App</CardDescription>
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
                onClick={async () => {
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

                    const { error } = await supabase.from("api_keys").insert({
                      user_id: user.id,
                      provider: "instagram",
                      api_key: instagramAppId,
                      owner_id: instagramSecret
                    });

                    if (error) throw error;

                    toast.success("Instagram connected successfully");
                    setInstagramAppId("");
                    setInstagramSecret("");
                  } catch (error) {
                    console.error("Error connecting Instagram:", error);
                    toast.error("Failed to connect Instagram");
                  } finally {
                    setIsConnecting(false);
                  }
                }}
                disabled={isConnecting}
              >
                <Link className="mr-2 h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Instagram"}
              </Button>
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
