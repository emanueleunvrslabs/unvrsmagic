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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    console.log(`Checking scheduled posts at ${now.toISOString()}`);

    // Query scheduled posts that are due (scheduled_at <= now AND status = 'scheduled')
    const { data: scheduledPosts, error: postsError } = await supabase
      .from("ai_social_scheduled_posts")
      .select("*, ai_social_workflows(*)")
      .eq("status", "scheduled")
      .lte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true });

    if (postsError) {
      throw new Error(`Failed to fetch scheduled posts: ${postsError.message}`);
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log("No scheduled posts due for execution");
      return new Response(
        JSON.stringify({ message: "No scheduled posts due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${scheduledPosts.length} scheduled posts to execute`);

    // Process each scheduled post in background
    const processScheduledPosts = async () => {
      for (const post of scheduledPosts) {
        try {
          const workflow = post.ai_social_workflows;
          if (!workflow) {
            console.error(`No workflow found for scheduled post ${post.id}`);
            await supabase
              .from("ai_social_scheduled_posts")
              .update({ status: "failed", error_message: "Workflow not found" })
              .eq("id", post.id);
            continue;
          }

          // Check if workflow is still active
          if (!workflow.active) {
            console.log(`Workflow ${workflow.name} is paused, skipping post ${post.id}`);
            await supabase
              .from("ai_social_scheduled_posts")
              .delete()
              .eq("id", post.id);
            continue;
          }

          console.log(`Processing scheduled post ${post.id} for workflow: ${workflow.name}`);

          // Mark as processing
          await supabase
            .from("ai_social_scheduled_posts")
            .update({ status: "processing" })
            .eq("id", post.id);

          // Run the workflow
          await runWorkflow(supabase, workflow, post.id);

          // Mark as published
          await supabase
            .from("ai_social_scheduled_posts")
            .update({ 
              status: "published", 
              published_at: new Date().toISOString() 
            })
            .eq("id", post.id);

          // Update workflow last_run_at
          await supabase
            .from("ai_social_workflows")
            .update({ last_run_at: new Date().toISOString() })
            .eq("id", workflow.id);

          // Calculate and insert next scheduled time
          await insertNextScheduledPost(supabase, workflow);

        } catch (error) {
          console.error(`Error processing scheduled post ${post.id}:`, error);
          await supabase
            .from("ai_social_scheduled_posts")
            .update({ 
              status: "failed", 
              error_message: error instanceof Error ? error.message : "Unknown error"
            })
            .eq("id", post.id);
        }
      }
    };

    // @ts-ignore
    EdgeRuntime.waitUntil(processScheduledPosts());

    return new Response(
      JSON.stringify({ 
        message: `Processing ${scheduledPosts.length} scheduled posts`,
        posts: scheduledPosts.map(p => ({ id: p.id, workflow: p.ai_social_workflows?.name }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in scheduled-workflows:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Calculate and insert the next scheduled time for a workflow
async function insertNextScheduledPost(supabase: any, workflow: any) {
  const scheduleConfig = workflow.schedule_config || {};
  const frequency = scheduleConfig.frequency || "daily";
  const times = scheduleConfig.times || ["09:00"];
  const days = scheduleConfig.days || [];

  // Don't schedule more for "once" frequency
  if (frequency === "once") {
    console.log(`Workflow ${workflow.name} is one-time, not scheduling next run`);
    return;
  }

  const now = new Date();
  const nextTime = calculateNextScheduledTime(frequency, times, days, now);

  if (!nextTime) {
    console.log(`Could not calculate next scheduled time for workflow ${workflow.name}`);
    return;
  }

  // Check if this time slot already exists
  const { data: existing } = await supabase
    .from("ai_social_scheduled_posts")
    .select("id")
    .eq("workflow_id", workflow.id)
    .eq("scheduled_at", nextTime.toISOString())
    .eq("status", "scheduled")
    .maybeSingle();

  if (existing) {
    console.log(`Scheduled post for ${nextTime.toISOString()} already exists`);
    return;
  }

  // Insert the next scheduled post
  const { error } = await supabase
    .from("ai_social_scheduled_posts")
    .insert({
      workflow_id: workflow.id,
      user_id: workflow.user_id,
      scheduled_at: nextTime.toISOString(),
      status: "scheduled",
      platforms: workflow.platforms,
      caption: workflow.description || workflow.prompt_template?.substring(0, 200),
      metadata: { schedule_config: scheduleConfig }
    });

  if (error) {
    console.error(`Failed to insert next scheduled post: ${error.message}`);
  } else {
    console.log(`Scheduled next run for workflow ${workflow.name} at ${nextTime.toISOString()}`);
  }
}

// Calculate the next scheduled time based on frequency and configuration
function calculateNextScheduledTime(
  frequency: string, 
  times: string[], 
  days: string[], 
  fromDate: Date
): Date | null {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Sort times
  const sortedTimes = [...times].sort();
  
  // Start checking from today
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const checkDate = new Date(fromDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    const dayName = dayNames[checkDate.getDay()];

    // Check if this day is valid for the frequency
    let isDayValid = false;
    if (frequency === "daily") {
      isDayValid = true;
    } else if (frequency === "weekly" || frequency === "custom") {
      isDayValid = days.includes(dayName);
    }

    if (!isDayValid) continue;

    // Check each time slot for this day
    for (const timeStr of sortedTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const candidateTime = new Date(checkDate);
      candidateTime.setHours(hours, minutes, 0, 0);

      // Must be in the future (at least 1 minute from now)
      if (candidateTime.getTime() > fromDate.getTime() + 60000) {
        return candidateTime;
      }
    }
  }

  return null;
}

async function runWorkflow(supabase: any, workflow: any, scheduledPostId: string) {
  const userId = workflow.user_id;
  const scheduleConfig = workflow.schedule_config || {};
  const isVideo = workflow.content_type === "video";

  // Get Fal API key
  const { data: falKeyData } = await supabase
    .from("api_keys")
    .select("api_key")
    .eq("user_id", userId)
    .eq("provider", "fal")
    .maybeSingle();

  if (!falKeyData) {
    throw new Error("Fal API key not found");
  }

  const FAL_KEY = falKeyData.api_key;

  // Get Instagram credentials
  const { data: instagramData } = await supabase
    .from("api_keys")
    .select("api_key, owner_id")
    .eq("user_id", userId)
    .eq("provider", "instagram")
    .maybeSingle();

  const hasInstagram = !!instagramData && workflow.platforms?.includes("instagram");

  // Create content record
  const contentTitle = `${workflow.name} - ${new Date().toLocaleString("it-IT")}`;
  const { data: content, error: contentError } = await supabase
    .from("ai_social_content")
    .insert({
      user_id: userId,
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

  // Link content to scheduled post
  await supabase
    .from("ai_social_scheduled_posts")
    .update({ content_id: content.id })
    .eq("id", scheduledPostId);

  try {
    let generatedMediaUrl: string;

    if (isVideo) {
      generatedMediaUrl = await generateVideo(FAL_KEY, workflow, scheduleConfig);
    } else {
      generatedMediaUrl = await generateImage(FAL_KEY, workflow, scheduleConfig);
    }

    console.log("Media generated:", generatedMediaUrl);

    // Update content record
    await supabase
      .from("ai_social_content")
      .update({ 
        status: "completed",
        media_url: generatedMediaUrl,
        thumbnail_url: generatedMediaUrl
      })
      .eq("id", content.id);

    // Post to Instagram
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
      } catch (igError) {
        console.error("Instagram publishing error:", igError);
      }
    }

  } catch (error) {
    console.error("Workflow processing error:", error);
    await supabase
      .from("ai_social_content")
      .update({ 
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error"
      })
      .eq("id", content.id);
    throw error;
  }
}

// Generate video using Veo3.1
async function generateVideo(falKey: string, workflow: any, scheduleConfig: any): Promise<string> {
  const mode = scheduleConfig.generation_mode || "text-to-video";
  const aspectRatio = scheduleConfig.aspect_ratio || "16:9";
  const duration = scheduleConfig.duration || "8s";
  const generateAudio = scheduleConfig.generate_audio ?? true;

  console.log(`Generating video: mode=${mode}, aspect_ratio=${aspectRatio}, duration=${duration}`);

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
        console.error("Video container processing failed");
        return;
      }
    }
    
    pollAttempts++;
  }

  if (!containerReady) {
    console.error("Timeout waiting for video container to be ready");
    return;
  }

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
