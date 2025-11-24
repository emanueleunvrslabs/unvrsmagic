import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "owner" | "admin" | "user";

export const useUserRole = () => {
  const { data: roles, isLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((r) => r.role as UserRole);
    },
  });

  const isOwner = roles?.includes("owner") || false;
  const isAdmin = roles?.includes("admin") || false;
  const isUser = roles?.includes("user") || false;

  return {
    roles: roles || [],
    isOwner,
    isAdmin,
    isUser,
    loading: isLoading,
  };
};
