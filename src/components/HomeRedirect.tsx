import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const HomeRedirect = () => {
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setTargetRoute("/auth");
          return;
        }

        // Check user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleData?.role === "owner") {
          setTargetRoute("/admin/dashboard");
        } else {
          // Regular users go to marketplace
          setTargetRoute("/marketplace");
        }
      } catch (error) {
        console.error("Error determining redirect:", error);
        setTargetRoute("/marketplace");
      } finally {
        setLoading(false);
      }
    };

    determineRedirect();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <Navigate to={targetRoute || "/marketplace"} replace />;
};
