import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MarketplaceProject } from "./useMarketplaceProjects";
import { useAuth } from "./use-auth";

export const useUserProjects = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { data: userProjects, isLoading } = useQuery({
    queryKey: ["user-projects", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_projects")
        .select(`
          id,
          project_id,
          added_at,
          marketplace_projects (
            id,
            name,
            description,
            icon,
            route,
            published
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;
      return data.map((up) => ({
        ...up,
        project: up.marketplace_projects as unknown as MarketplaceProject,
      }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const addProject = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userId) throw new Error("Non autenticato");

      const { error } = await supabase
        .from("user_projects")
        .insert({ user_id: userId, project_id: projectId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-projects"] });
      toast.success("Progetto aggiunto alla tua dashboard");
    },
    onError: (error: Error & { code?: string }) => {
      if (error.code === "23505") {
        toast.error("Progetto già aggiunto");
      } else {
        toast.error("Errore nell'aggiunta del progetto");
      }
      console.error(error);
    },
  });

  const removeProject = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userId) throw new Error("Non autenticato");

      const { error } = await supabase
        .from("user_projects")
        .delete()
        .eq("user_id", userId)
        .eq("project_id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-projects"] });
      toast.success("Progetto rimosso dalla tua dashboard");
    },
    onError: (error) => {
      toast.error("Errore nella rimozione del progetto");
      console.error(error);
    },
  });

  return {
    userProjects: userProjects || [],
    loading: isLoading,
    addProject,
    removeProject,
  };
};
