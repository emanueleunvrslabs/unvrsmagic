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

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
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

    // Get workflow data
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

    // Get Fal API key
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

    // Get Instagram credentials
    const { data: instagramData } = await supabase
      .from("api_keys")
      .select("api_key, owner_id")
      .eq("user_id", user.id)
      .eq("provider", "instagram")
      .maybeSingle();

    const hasInstagram = !!instagramData && workflow.platforms?.includes("instagram");

    // Create content record
    const contentTitle = `${workflow.name} - ${new Date().toLocaleString("it-IT")}`;
    const { data: content, error: contentError } = await supabase
      .from("ai_social_content")
      .insert({
        user_id: user.id,
        title: contentTitle,
        prompt: workflow.prompt_template,
        type: workflow.content_type,
        status: "generating"
      })
      .select()
      .single();

    if (contentError || !content) {
      throw new Error("Failed to create content record");
    }

    // Process synchronously so client can poll real progress
    try {
      const scheduleConfig = workflow.schedule_config || {};
      const isVideo = workflow.content_type === "video";
      
      let generatedMediaUrl: string;
      
      if (isVideo) {
        generatedMediaUrl = await generateVideo(FAL_KEY, workflow, scheduleConfig);
      } else {
        generatedMediaUrl = await generateImage(FAL_KEY, workflow, scheduleConfig);
      }

      console.log("Media generated:", generatedMediaUrl);

      // Update content record with generated media
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "completed",
          media_url: generatedMediaUrl,
          thumbnail_url: generatedMediaUrl
        })
        .eq("id", content.id);

      let instagramResult: { success: boolean; error?: string } = { success: false };

      // Post to Instagram if connected
      if (hasInstagram && instagramData) {
        console.log("Publishing to Instagram...");
        
        try {
          const accessToken = instagramData.api_key;
          const igUserId = instagramData.owner_id;

          if (isVideo) {
            await publishVideoToInstagram(
              accessToken,
              igUserId,
              generatedMediaUrl,
              workflow.description || workflow.prompt_template.substring(0, 200) + "..."
            );
          } else {
            await publishImageToInstagram(
              accessToken,
              igUserId,
              generatedMediaUrl,
              workflow.description || workflow.prompt_template.substring(0, 200) + "..."
            );
          }
          instagramResult = { success: true };
        } catch (igError) {
          console.error("Instagram publishing error:", igError);
          instagramResult = { success: false, error: igError instanceof Error ? igError.message : "Unknown error" };
        }
      }

      // Update workflow last_run_at
      await supabase
        .from("ai_social_workflows")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", workflowId);

      return new Response(
        JSON.stringify({ 
          success: true,
          contentId: content.id,
          status: "completed",
          mediaUrl: generatedMediaUrl,
          instagram: hasInstagram ? instagramResult : undefined
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Generation error:", error);
      // Update content record with error
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

// Generate video using Veo3.1
async function generateVideo(falKey: string, workflow: any, scheduleConfig: any): Promise<string> {
  const mode = scheduleConfig.generation_mode || "text-to-video";
  const aspectRatio = scheduleConfig.aspect_ratio || "16:9";
  const duration = scheduleConfig.duration || "8s";
  const generateAudio = scheduleConfig.generate_audio ?? true;

  console.log(`Generating video with mode: ${mode}, aspect_ratio: ${aspectRatio}, duration: ${duration}`);

  let endpoint = "fal-ai/veo3";
  const requestBody: any = {
    prompt: workflow.prompt_template,
    aspect_ratio: aspectRatio,
    duration: duration,
  };

  if (mode !== "image-to-video") {
    requestBody.generate_audio = generateAudio;
  }

  if (mode === "image-to-video" && scheduleConfig.image_urls?.length > 0) {
    endpoint = "fal-ai/veo3/image-to-video";
    requestBody.image_url = scheduleConfig.image_urls[0];
  } else if (mode === "reference-to-video" && scheduleConfig.image_urls?.length > 0) {
    endpoint = "fal-ai/veo3/reference-to-video";
    requestBody.reference_image_url = scheduleConfig.image_urls[0];
    requestBody.duration = "8s";
  } else if (mode === "first-last-frame" && scheduleConfig.first_frame_image && scheduleConfig.last_frame_image) {
    endpoint = "fal-ai/veo3/first-last-frame-to-video";
    requestBody.first_frame_url = scheduleConfig.first_frame_image;
    requestBody.last_frame_url = scheduleConfig.last_frame_image;
  }

  console.log(`Using endpoint: ${endpoint}`);

  const response = await fetch(`https://queue.fal.run/${endpoint}`, {
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
  const requestId = queueData.request_id;

  if (!requestId) {
    throw new Error("No request_id returned from Fal API");
  }

  console.log(`Fal video request queued with ID: ${requestId}`);

  let resultData;
  let attempts = 0;
  const maxAttempts = 300;
  const baseEndpoint = endpoint.split('/').slice(0, 2).join('/');

  while (attempts < maxAttempts) {
    const resultResponse = await fetch(`https://queue.fal.run/${baseEndpoint}/requests/${requestId}`, {
      headers: { "Authorization": `Key ${falKey}` },
    });

    if (resultResponse.status === 200) {
      resultData = await resultResponse.json();
      console.log("Got completed video result");
      break;
    }
    
    if (resultResponse.status === 202) {
      const statusInfo = await resultResponse.json();
      if (statusInfo.status === "FAILED") {
        throw new Error(`Video generation failed: ${JSON.stringify(statusInfo.error)}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  if (!resultData) {
    throw new Error("Timeout waiting for video generation");
  }

  const videoUrl = resultData.video?.url;
  if (!videoUrl) {
    throw new Error("No video URL returned from AI");
  }

  return videoUrl;
}

// Generate image using Nano Banana
async function generateImage(falKey: string, workflow: any, scheduleConfig: any): Promise<string> {
  const mode = scheduleConfig.generation_mode || "text-to-image";
  const aspectRatio = scheduleConfig.aspect_ratio || "1:1";
  const resolution = scheduleConfig.resolution || "1K";
  const outputFormat = scheduleConfig.output_format || "jpeg";

  const endpoint = mode === "image-to-image" 
    ? "fal-ai/nano-banana-pro/edit" 
    : "fal-ai/nano-banana-pro";
  const pollingEndpoint = "fal-ai/nano-banana-pro";

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

  const response = await fetch(`https://queue.fal.run/${endpoint}`, {
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
  const requestId = queueData.request_id;

  if (!requestId) {
    throw new Error("No request_id returned from Fal API");
  }

  let resultData;
  let attempts = 0;
  const maxAttempts = 150;

  while (attempts < maxAttempts) {
    const resultResponse = await fetch(`https://queue.fal.run/${pollingEndpoint}/requests/${requestId}`, {
      headers: { "Authorization": `Key ${falKey}` },
    });

    if (resultResponse.status === 200) {
      resultData = await resultResponse.json();
      break;
    }
    
    if (resultResponse.status === 202) {
      const statusInfo = await resultResponse.json();
      if (statusInfo.status === "FAILED") {
        throw new Error(`Image generation failed: ${JSON.stringify(statusInfo.error)}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  if (!resultData) {
    throw new Error("Timeout waiting for image generation");
  }

  const imageUrl = resultData.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error("No image URL returned from AI");
  }

  return imageUrl;
}

// Publish image to Instagram
async function publishImageToInstagram(accessToken: string, igUserId: string, imageUrl: string, caption: string) {
  const containerResponse = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
      }),
    }
  );

  if (!containerResponse.ok) {
    const errorText = await containerResponse.text();
    console.error("Instagram container creation failed:", errorText);
    return;
  }

  const containerData = await containerResponse.json();
  await new Promise(resolve => setTimeout(resolve, 5000));

  const publishResponse = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    }
  );

  if (publishResponse.ok) {
    const publishData = await publishResponse.json();
    console.log("Instagram post published:", publishData.id);
  }
}

// Publish video to Instagram (Reels)
async function publishVideoToInstagram(accessToken: string, igUserId: string, videoUrl: string, caption: string) {
  console.log("Creating video container for Instagram Reels...");
  
  const containerResponse = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: videoUrl,
        caption: caption,
        media_type: "REELS",
        access_token: accessToken,
      }),
    }
  );

  if (!containerResponse.ok) {
    const errorText = await containerResponse.text();
    console.error("Instagram video container creation failed:", errorText);
    return;
  }

  const containerData = await containerResponse.json();
  console.log("Video container created:", containerData.id);

  let containerReady = false;
  let pollAttempts = 0;

  while (!containerReady && pollAttempts < 60) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse = await fetch(
      `https://graph.facebook.com/v19.0/${containerData.id}?fields=status_code&access_token=${accessToken}`
    );
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log("Container status:", statusData.status_code);
      
      if (statusData.status_code === "FINISHED") {
        containerReady = true;
      } else if (statusData.status_code === "ERROR") {
        console.error("Video processing failed on Instagram");
        return;
      }
    }
    pollAttempts++;
  }

  if (!containerReady) return;

  const publishResponse = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    }
  );

  if (publishResponse.ok) {
    const publishData = await publishResponse.json();
    console.log("Instagram Reel published:", publishData.id);
  }
}
