import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketplaceProject {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  published: boolean;
  coming_soon: boolean;
  route: string;
  created_at: string;
  updated_at: string;
}

export const useMarketplaceProjects = () => {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["marketplace-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_projects")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MarketplaceProject[];
    },
  });

  const { data: allProjects, isLoading: allLoading } = useQuery({
    queryKey: ["all-marketplace-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MarketplaceProject[];
    },
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("marketplace_projects")
        .update({ published })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-marketplace-projects"] });
      toast.success("Progetto aggiornato");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento del progetto");
      console.error(error);
    },
  });

  const toggleComingSoon = useMutation({
    mutationFn: async ({ id, coming_soon }: { id: string; coming_soon: boolean }) => {
      const { error } = await supabase
        .from("marketplace_projects")
        .update({ coming_soon })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-marketplace-projects"] });
      toast.success("Progetto aggiornato");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento del progetto");
      console.error(error);
    },
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<MarketplaceProject, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("marketplace_projects")
        .insert(project);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-marketplace-projects"] });
      toast.success("Progetto creato");
    },
    onError: (error) => {
      toast.error("Errore nella creazione del progetto");
      console.error(error);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketplace_projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-marketplace-projects"] });
      toast.success("Progetto eliminato");
    },
    onError: (error) => {
      toast.error("Errore nell'eliminazione del progetto");
      console.error(error);
    },
  });

  return {
    projects: projects || [],
    allProjects: allProjects || [],
    loading: isLoading,
    allLoading,
    togglePublished,
    toggleComingSoon,
    createProject,
    deleteProject,
  };
};
