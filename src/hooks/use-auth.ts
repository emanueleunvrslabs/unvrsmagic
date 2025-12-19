import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthData {
  user: User | null;
  profile: {
    username: string | null;
    full_name: string | null;
    phone_number: string;
    ref_code: string | null;
  } | null;
}

export const useAuth = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async (): Promise<AuthData> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { user: null, profile: null };
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name, phone_number, ref_code")
        .eq("user_id", user.id)
        .single();

      return { user, profile };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isLoading,
    userId: data?.user?.id ?? null,
  };
};
