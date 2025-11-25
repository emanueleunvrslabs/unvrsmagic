import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDispatchJobNotifications(userId: string | undefined) {
  const previousJobsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!userId) return;

    // Fetch initial jobs state
    const fetchInitialJobs = async () => {
      const { data: jobs } = await supabase
        .from("dispatch_jobs")
        .select("id, status")
        .eq("user_id", userId);

      if (jobs) {
        jobs.forEach((job) => {
          previousJobsRef.current.set(job.id, job.status || "");
        });
      }
    };

    fetchInitialJobs();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("dispatch-jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "dispatch_jobs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newJob = payload.new as any;
          const previousStatus = previousJobsRef.current.get(newJob.id);

          // Only show notification if status actually changed
          if (previousStatus && previousStatus !== newJob.status) {
            const zoneCode = newJob.zone_code || "Zona";
            const month = newJob.dispatch_month || "";

            if (newJob.status === "completed") {
              toast.success("Elaborazione completata", {
                description: `${zoneCode} - ${month} è stato elaborato con successo`,
                duration: 5000,
              });
            } else if (newJob.status === "failed") {
              const errorMessage =
                newJob.errors && Array.isArray(newJob.errors) && newJob.errors.length > 0
                  ? newJob.errors[0]
                  : "Errore sconosciuto";

              toast.error("Elaborazione fallita", {
                description: `${zoneCode} - ${month}: ${errorMessage}`,
                duration: 8000,
              });
            } else if (newJob.status === "processing" && previousStatus === "pending") {
              toast.info("Elaborazione avviata", {
                description: `Processamento di ${zoneCode} - ${month} in corso`,
                duration: 3000,
              });
            }
          }

          // Update previous status
          previousJobsRef.current.set(newJob.id, newJob.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
