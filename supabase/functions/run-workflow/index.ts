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
    const { data: falKeyData, error: falKeyError } = await supabase
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
    const { data: instagramData, error: instagramError } = await supabase
      .from("api_keys")
      .select("api_key, owner_id")
      .eq("user_id", user.id)
      .eq("provider", "instagram")
      .maybeSingle();

    const hasInstagram = !!instagramData && workflow.platforms?.includes("instagram");

    console.log("Has Instagram:", hasInstagram);

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

    console.log("Content record created:", content.id);

    // Determine generation parameters
    const scheduleConfig = workflow.schedule_config || {};
    const isVideo = workflow.content_type === "video";
    
    let generatedMediaUrl: string;
    
    if (isVideo) {
      // VIDEO GENERATION using Veo3.1
      generatedMediaUrl = await generateVideo(FAL_KEY, workflow, scheduleConfig);
    } else {
      // IMAGE GENERATION using Nano Banana
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

    // Post to Instagram if connected
    let instagramPostResult = null;
    if (hasInstagram && instagramData) {
      console.log("Publishing to Instagram...");
      
      try {
        const accessToken = instagramData.api_key;
        const igUserId = instagramData.owner_id;

        if (isVideo) {
          // Video publishing to Instagram
          instagramPostResult = await publishVideoToInstagram(
            accessToken,
            igUserId,
            generatedMediaUrl,
            workflow.description || workflow.prompt_template.substring(0, 200) + "..."
          );
        } else {
          // Image publishing to Instagram
          instagramPostResult = await publishImageToInstagram(
            accessToken,
            igUserId,
            generatedMediaUrl,
            workflow.description || workflow.prompt_template.substring(0, 200) + "..."
          );
        }
      } catch (igError) {
        console.error("Instagram publishing error:", igError);
        instagramPostResult = { error: igError instanceof Error ? igError.message : "Unknown error" };
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
        mediaUrl: generatedMediaUrl,
        instagram: instagramPostResult
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

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
  const resolution = scheduleConfig.resolution || "720p";
  const duration = scheduleConfig.duration || "8s";
  const generateAudio = scheduleConfig.generate_audio ?? true;

  console.log(`Generating video with mode: ${mode}, aspect_ratio: ${aspectRatio}, resolution: ${resolution}, duration: ${duration}`);

  // Determine endpoint based on mode
  let endpoint = "fal-ai/veo3";
  const requestBody: any = {
    prompt: workflow.prompt_template,
    aspect_ratio: aspectRatio,
    duration: duration,
  };

  // Add generate_audio if supported
  if (mode !== "image-to-video") {
    requestBody.generate_audio = generateAudio;
  }

  // Handle different video modes
  if (mode === "image-to-video" && scheduleConfig.image_urls?.length > 0) {
    endpoint = "fal-ai/veo3/image-to-video";
    requestBody.image_url = scheduleConfig.image_urls[0];
  } else if (mode === "reference-to-video" && scheduleConfig.image_urls?.length > 0) {
    endpoint = "fal-ai/veo3/reference-to-video";
    requestBody.reference_image_url = scheduleConfig.image_urls[0];
    requestBody.duration = "8s"; // Reference mode is always 8s
  } else if (mode === "first-last-frame-to-video" && scheduleConfig.first_frame_url && scheduleConfig.last_frame_url) {
    endpoint = "fal-ai/veo3/first-last-frame-to-video";
    requestBody.first_frame_url = scheduleConfig.first_frame_url;
    requestBody.last_frame_url = scheduleConfig.last_frame_url;
  }

  console.log(`Using endpoint: ${endpoint}`);
  console.log("Request body:", JSON.stringify(requestBody));

  // Call Fal API
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
    console.error("Fal API error:", response.status, errorText);
    throw new Error(`Fal API video generation failed: ${errorText}`);
  }

  const queueData = await response.json();
  const requestId = queueData.request_id;

  if (!requestId) {
    throw new Error("No request_id returned from Fal API");
  }

  console.log(`Fal video request queued with ID: ${requestId}`);

  // Poll for result - videos take longer
  let resultData;
  let attempts = 0;
  const maxAttempts = 300; // Wait up to 10 minutes for video

  // Use base endpoint for polling
  const baseEndpoint = endpoint.split('/').slice(0, 2).join('/'); // fal-ai/veo3

  while (attempts < maxAttempts) {
    const resultResponse = await fetch(`https://queue.fal.run/${baseEndpoint}/requests/${requestId}`, {
      headers: {
        "Authorization": `Key ${falKey}`,
      },
    });

    console.log(`Video poll attempt ${attempts + 1}, status: ${resultResponse.status}`);

    if (resultResponse.status === 200) {
      resultData = await resultResponse.json();
      console.log("Got completed video result");
      break;
    }
    
    if (resultResponse.status === 202) {
      const statusInfo = await resultResponse.json();
      console.log("Video status:", statusInfo.status);
      if (statusInfo.status === "FAILED") {
        throw new Error(`Video generation failed: ${JSON.stringify(statusInfo.error)}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  if (!resultData) {
    throw new Error("Timeout waiting for video generation to complete");
  }

  // Extract video URL
  const videoUrl = resultData.video?.url;

  if (!videoUrl) {
    console.error("Unexpected result structure:", JSON.stringify(resultData));
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

  // Set endpoint based on mode
  const endpoint = mode === "image-to-image" 
    ? "fal-ai/nano-banana-pro/edit" 
    : "fal-ai/nano-banana-pro";
  const pollingEndpoint = "fal-ai/nano-banana-pro";

  console.log(`Generating image with endpoint ${endpoint}, mode: ${mode}`);

  // Prepare request body
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

  console.log("Request body:", JSON.stringify(requestBody));

  // Call Fal API
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
    console.error("Fal API error:", response.status, errorText);
    throw new Error(`Fal API image generation failed: ${errorText}`);
  }

  const queueData = await response.json();
  const requestId = queueData.request_id;

  if (!requestId) {
    throw new Error("No request_id returned from Fal API");
  }

  console.log(`Fal image request queued with ID: ${requestId}`);

  // Poll for result
  let resultData;
  let attempts = 0;
  const maxAttempts = 150; // Wait up to 5 minutes

  while (attempts < maxAttempts) {
    const resultResponse = await fetch(`https://queue.fal.run/${pollingEndpoint}/requests/${requestId}`, {
      headers: {
        "Authorization": `Key ${falKey}`,
      },
    });

    console.log(`Image poll attempt ${attempts + 1}, status: ${resultResponse.status}`);

    if (resultResponse.status === 200) {
      resultData = await resultResponse.json();
      console.log("Got completed image result");
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
    throw new Error("Timeout waiting for image generation to complete");
  }

  // Extract image URL
  const imageUrl = resultData.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from AI");
  }

  return imageUrl;
}

// Publish image to Instagram
async function publishImageToInstagram(accessToken: string, igUserId: string, imageUrl: string, caption: string) {
  // Step 1: Create media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    return { error: errorText };
  }

  const containerData = await containerResponse.json();
  console.log("Media container created:", containerData.id);

  // Wait a moment for Instagram to process the image
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 2: Publish the media
  const publishResponse = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    }
  );

  if (!publishResponse.ok) {
    const errorText = await publishResponse.text();
    console.error("Instagram publish failed:", errorText);
    return { error: errorText };
  }

  const publishData = await publishResponse.json();
  console.log("Instagram post published:", publishData.id);
  return { success: true, postId: publishData.id };
}

// Publish video to Instagram (Reels)
async function publishVideoToInstagram(accessToken: string, igUserId: string, videoUrl: string, caption: string) {
  console.log("Creating video container for Instagram Reels...");
  
  // Step 1: Create video container for Reels
  const containerResponse = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    return { error: errorText };
  }

  const containerData = await containerResponse.json();
  console.log("Video container created:", containerData.id);

  // Wait longer for Instagram to process the video
  console.log("Waiting for video processing...");
  
  // Poll for container status
  let containerReady = false;
  let pollAttempts = 0;
  const maxPollAttempts = 60; // Up to 5 minutes

  while (!containerReady && pollAttempts < maxPollAttempts) {
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
        return { error: "Video processing failed on Instagram" };
      }
    }
    
    pollAttempts++;
  }

  if (!containerReady) {
    return { error: "Timeout waiting for video processing" };
  }

  // Step 2: Publish the video
  const publishResponse = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    }
  );

  if (!publishResponse.ok) {
    const errorText = await publishResponse.text();
    console.error("Instagram video publish failed:", errorText);
    return { error: errorText };
  }

  const publishData = await publishResponse.json();
  console.log("Instagram Reel published:", publishData.id);
  return { success: true, postId: publishData.id };
}
