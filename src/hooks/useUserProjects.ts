import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MarketplaceProject } from "./useMarketplaceProjects";

export const useUserProjects = () => {
  const queryClient = useQueryClient();

  const { data: userProjects, isLoading } = useQuery({
    queryKey: ["user-projects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

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
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((up) => ({
        ...up,
        project: up.marketplace_projects as unknown as MarketplaceProject,
      }));
    },
  });

  const addProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autenticato");

      const { error } = await supabase
        .from("user_projects")
        .insert({ user_id: user.id, project_id: projectId });

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autenticato");

      const { error } = await supabase
        .from("user_projects")
        .delete()
        .eq("user_id", user.id)
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
