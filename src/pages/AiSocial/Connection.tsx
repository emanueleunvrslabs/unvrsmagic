import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Connection() {
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
  useEffect(() => {
    // Check if redirected back from OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("Instagram connected successfully!");
      window.history.replaceState({}, '', '/ai-social/connection');
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
              >
                <Link className="mr-2 h-4 w-4" />
                Connect Instagram
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
