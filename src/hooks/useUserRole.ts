import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type UserRole = "owner" | "admin" | "user";

export const useUserRole = () => {
  const { userId } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["user-role", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;
      return data.map((r) => r.role as UserRole);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
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
