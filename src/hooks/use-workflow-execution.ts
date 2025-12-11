import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Workflow, WorkflowContentType } from "@/types/ai-social";

type RunningStage = "openai" | "nano" | "instagram" | null;

interface UseWorkflowExecutionReturn {
  runningWorkflowId: string | null;
  runningStage: RunningStage;
  handleRunNow: (workflow: Workflow, onComplete?: () => void) => Promise<void>;
}

export function useWorkflowExecution(
  hasInsufficientCredits: (type: "image" | "video") => boolean,
  getRequiredCredits: (type: "image" | "video") => number,
  imageCost: number,
  videoCost: number
): UseWorkflowExecutionReturn {
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);
  const [runningStage, setRunningStage] = useState<RunningStage>(null);

  const handleRunNow = useCallback(async (workflow: Workflow, onComplete?: () => void) => {
    const contentType = workflow.content_type as WorkflowContentType;
    const isVideo = contentType === "video";
    const requiredCredits = isVideo ? videoCost : imageCost;
    
    // Check credits first
    if (hasInsufficientCredits(contentType)) {
      toast.error(`Insufficient credits. You need at least €${requiredCredits} to run this workflow.`);
      return;
    }

    setRunningWorkflowId(workflow.id);
    
    const startTime = Date.now();
    const formatElapsed = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      return `${elapsed}s`;
    };
    
    try {
      // Stage 1: OpenAI preparation (show for 3 seconds)
      setRunningStage("openai");
      toast.info("Preparing workflow...", { description: "Processing prompt and parameters..." });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Start the edge function
      const invokePromise = supabase.functions.invoke('run-workflow', {
        body: { workflowId: workflow.id }
      });

      // Wait for content record to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Stage 2: Generation stage - poll until completion
      setRunningStage("nano");
      toast.info(`Starting ${isVideo ? 'video' : 'image'} generation...`, { 
        description: `${isVideo ? 'Veo3' : 'Nano Banana'} is starting...` 
      });
      
      let pollCount = 0;
      let contentCompleted = false;
      
      const pollForCompletion = async (): Promise<boolean> => {
        pollCount++;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;

        const { data: contents } = await supabase
          .from('ai_social_content')
          .select('id, status, media_url, error_message')
          .eq('user_id', session.user.id)
          .gte('created_at', new Date(startTime - 5000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (contents && contents.length > 0) {
          const content = contents[0];
          
          // Show progress update every 10 seconds (every ~3 polls)
          if (pollCount % 3 === 0 && content.status === 'generating') {
            toast.info(`${isVideo ? 'Video' : 'Image'} generating... (${formatElapsed()})`, { 
              description: `${isVideo ? 'Veo3' : 'Nano Banana'} is working... please wait` 
            });
          }
          
          if (content.status === 'completed' && content.media_url) {
            return true; // Generation complete!
          } else if (content.status === 'failed') {
            throw new Error(content.error_message || 'Generation failed');
          }
        }
        
        return false; // Keep polling
      };
      
      // Poll every 3 seconds until generation completes
      while (!contentCompleted) {
        contentCompleted = await pollForCompletion();
        if (!contentCompleted) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      toast.success(`${isVideo ? 'Video' : 'Image'} generated! (${formatElapsed()})`, {
        description: "Media ready!"
      });
      
      // Stage 3: Instagram publishing (if configured)
      if (workflow.platforms?.includes("instagram")) {
        setRunningStage("instagram");
        toast.info("Publishing to Instagram...", { 
          description: "Uploading and creating post..." 
        });
        // Wait for Instagram publishing to complete (give it 10 seconds to show the badge)
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      // Wait for edge function to fully complete
      const { data, error } = await invokePromise;
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Final success message
      const totalTime = formatElapsed();
      if (data?.instagram?.success) {
        toast.success(`Workflow completed! (${totalTime})`, { 
          description: "Content generated and published to Instagram!" 
        });
      } else if (data?.instagram?.error) {
        toast.success(`${isVideo ? 'Video' : 'Image'} generated! (${totalTime})`, { 
          description: `Content created but Instagram failed: ${data.instagram.error}` 
        });
      } else {
        toast.success(`Workflow completed! (${totalTime})`, { 
          description: "Content generated successfully!" 
        });
      }

      onComplete?.();
    } catch (error) {
      console.error("Error running workflow:", error);
      const totalTime = formatElapsed();
      toast.error(`Failed to run workflow (${totalTime})`, {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setRunningWorkflowId(null);
      setRunningStage(null);
    }
  }, [hasInsufficientCredits, getRequiredCredits, imageCost, videoCost]);

  return {
    runningWorkflowId,
    runningStage,
    handleRunNow,
  };
}
