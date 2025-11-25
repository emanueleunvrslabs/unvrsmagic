import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflowId } = await req.json();

    if (!workflowId) {
      return new Response(
        JSON.stringify({ error: "Missing workflowId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    console.log("Running workflow for user:", user.id);

    const { data: workflow, error: workflowError } = await supabase
      .from("ai_social_workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("user_id", user.id)
      .single();

    if (workflowError || !workflow) {
      throw new Error("Workflow not found");
    }

    console.log("Workflow found:", workflow.name, "Type:", workflow.content_type);

    const { data: falKeyData } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("user_id", user.id)
      .eq("provider", "fal")
      .maybeSingle();

    if (!falKeyData) {
      throw new Error("Fal API key not found. Please configure it in AI Models API settings.");
    }

    const FAL_KEY = falKeyData.api_key;

    // Create content record
    const contentTitle = workflow.name;
    const { data: content, error: contentError } = await supabase
      .from("ai_social_content")
      .insert({
        user_id: user.id,
        title: contentTitle,
        prompt: workflow.prompt_template,
        type: workflow.content_type,
        status: "generating",
        metadata: { workflow_id: workflowId }
      })
      .select()
      .single();

    if (contentError || !content) {
      throw new Error("Failed to create content record");
    }

    console.log("Content record created:", content.id);

    // Build webhook URL for Fal to call when generation completes
    const webhookUrl = `${supabaseUrl}/functions/v1/fal-webhook?contentId=${content.id}&workflowId=${workflowId}`;
    console.log("Webhook URL:", webhookUrl);

    try {
      const scheduleConfig = workflow.schedule_config || {};
      const isVideo = workflow.content_type === "video";
      
      // Queue the generation with webhook - returns immediately
      if (isVideo) {
        await queueVideoGeneration(FAL_KEY, workflow, scheduleConfig, webhookUrl);
      } else {
        await queueImageGeneration(FAL_KEY, workflow, scheduleConfig, webhookUrl);
      }

      // Return immediately - webhook will handle completion
      return new Response(
        JSON.stringify({ 
          success: true,
          contentId: content.id,
          status: "generating",
          message: "Generation started, polling for status..."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Generation queue error:", error);
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error"
        })
        .eq("id", content.id);

      return new Response(
        JSON.stringify({ 
          success: false,
          contentId: content.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error in run-workflow:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Queue video generation with webhook as query parameter
async function queueVideoGeneration(falKey: string, workflow: any, scheduleConfig: any, webhookUrl: string): Promise<void> {
  const mode = scheduleConfig.generation_mode || "text-to-video";
  const aspectRatio = scheduleConfig.aspect_ratio || "16:9";
  const duration = scheduleConfig.duration || "8s";
  const generateAudio = scheduleConfig.generate_audio ?? true;

  console.log(`Queueing video with mode: ${mode}, aspect_ratio: ${aspectRatio}, duration: ${duration}`);

  // Use veo3.1 endpoints (not veo3)
  let endpoint = "fal-ai/veo3.1";
  const requestBody: any = {
    prompt: workflow.prompt_template,
    aspect_ratio: aspectRatio,
    duration: duration,
  };

  if (mode !== "image-to-video") {
    requestBody.generate_audio = generateAudio;
  }

  // Get reference image from either reference_image_url or image_urls (for backwards compatibility)
  const referenceImageUrl = scheduleConfig.reference_image_url || (scheduleConfig.image_urls?.length > 0 ? scheduleConfig.image_urls[0] : null);
  
  console.log(`Reference image URL exists: ${!!referenceImageUrl}, mode: ${mode}`);
  console.log(`image_urls length: ${scheduleConfig.image_urls?.length || 0}`);

  if (mode === "image-to-video" && scheduleConfig.image_urls?.length > 0) {
    endpoint = "fal-ai/veo3.1/image-to-video";
    requestBody.image_url = scheduleConfig.image_urls[0];
  } else if (mode === "reference-to-video" && referenceImageUrl) {
    endpoint = "fal-ai/veo3.1/reference-to-video";
    requestBody.reference_image_url = referenceImageUrl;
    requestBody.duration = "8s";
  } else if (mode === "first-last-frame" && (scheduleConfig.first_frame_url || scheduleConfig.first_frame_image) && (scheduleConfig.last_frame_url || scheduleConfig.last_frame_image)) {
    endpoint = "fal-ai/veo3.1/first-last-frame-to-video";
    requestBody.first_frame_url = scheduleConfig.first_frame_url || scheduleConfig.first_frame_image;
    requestBody.last_frame_url = scheduleConfig.last_frame_url || scheduleConfig.last_frame_image;
    requestBody.duration = "8s"; // First-last-frame only supports 8s duration
  }

  console.log(`Using endpoint: ${endpoint}`);

  // Pass webhook as query parameter fal_webhook
  const url = `https://queue.fal.run/${endpoint}?fal_webhook=${encodeURIComponent(webhookUrl)}`;
  console.log("Fal queue URL with webhook:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fal API video generation failed: ${errorText}`);
  }

  const queueData = await response.json();
  console.log(`Fal video request queued with ID: ${queueData.request_id}`);
}

// Queue image generation with webhook as query parameter
async function queueImageGeneration(falKey: string, workflow: any, scheduleConfig: any, webhookUrl: string): Promise<void> {
  const mode = scheduleConfig.generation_mode || "text-to-image";
  const aspectRatio = scheduleConfig.aspect_ratio || "1:1";
  const resolution = scheduleConfig.resolution || "1K";
  const outputFormat = scheduleConfig.output_format || "jpeg";

  const endpoint = mode === "image-to-image" 
    ? "fal-ai/nano-banana-pro/edit" 
    : "fal-ai/nano-banana-pro";

  const requestBody: any = {
    prompt: workflow.prompt_template,
    num_images: 1,
    output_format: outputFormat,
    resolution: resolution,
  };

  if (mode === "image-to-image" && scheduleConfig.image_urls?.length > 0) {
    requestBody.image_urls = scheduleConfig.image_urls;
    requestBody.aspect_ratio = aspectRatio || "auto";
  } else {
    requestBody.aspect_ratio = aspectRatio;
  }

  console.log(`Queueing image generation with endpoint: ${endpoint}`);

  // Pass webhook as query parameter fal_webhook
  const url = `https://queue.fal.run/${endpoint}?fal_webhook=${encodeURIComponent(webhookUrl)}`;
  console.log("Fal queue URL with webhook:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fal API image generation failed: ${errorText}`);
  }

  const queueData = await response.json();
  console.log(`Fal image request queued with ID: ${queueData.request_id}`);
}
