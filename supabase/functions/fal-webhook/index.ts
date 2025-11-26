import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fal.ai pricing (USD per unit) - based on fal.ai/pricing (Nov 2025)
const FAL_PRICING: Record<string, number> = {
  "fal-ai/nano-banana-pro": 0.04,       // $0.0398 per image
  "fal-ai/nano-banana-pro/edit": 0.04,  // $0.0398 per image (edit mode)
  "fal-ai/veo3": 0.40,                  // $0.40 per second
  "fal-ai/veo3.1": 0.40,                // $0.40 per second
};

// Video duration default (seconds) - used to calculate video cost
const DEFAULT_VIDEO_DURATION = 8;

function estimateCost(contentType: string, modelId?: string, durationSeconds?: number): number {
  if (contentType === "video") {
    const pricePerSecond = FAL_PRICING["fal-ai/veo3.1"] || 0.40;
    const duration = durationSeconds || DEFAULT_VIDEO_DURATION;
    return pricePerSecond * duration;
  }
  // Image
  if (modelId && FAL_PRICING[modelId]) {
    return FAL_PRICING[modelId];
  }
  return FAL_PRICING["fal-ai/nano-banana-pro"] || 0.04;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Fal webhook received:", JSON.stringify(payload));

    const { request_id, status, payload: resultPayload } = payload;

    // Extract contentId from the request URL or stored metadata
    const url = new URL(req.url);
    const contentId = url.searchParams.get("contentId");
    const workflowId = url.searchParams.get("workflowId");

    if (!contentId) {
      console.error("No contentId in webhook");
      return new Response(JSON.stringify({ error: "Missing contentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing webhook for content: ${contentId}, status: ${status}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (status === "OK" || status === "COMPLETED") {
      // Get media URL from result
      const videoUrl = resultPayload?.video?.url;
      const imageUrl = resultPayload?.images?.[0]?.url;
      const mediaUrl = videoUrl || imageUrl;

      // Extract cost/metrics from Fal response (if available)
      const metrics = payload.metrics || resultPayload?.metrics || {};
      const inferenceTime = metrics.inference_time || null;
      
      // Get content type to estimate cost
      const { data: contentData } = await supabase
        .from("ai_social_content")
        .select("type, metadata")
        .eq("id", contentId)
        .single();
      
      const contentType = contentData?.type || (videoUrl ? "video" : "image");
      const modelId = contentData?.metadata?.model_id;
      const durationStr = contentData?.metadata?.duration; // e.g., "8s"
      const durationSeconds = durationStr ? parseInt(durationStr.replace('s', '')) : undefined;
      
      // Calculate estimated cost based on content type and duration
      const estimatedCost = estimateCost(contentType, modelId, durationSeconds);
      console.log("Estimated cost:", { contentType, modelId, durationSeconds, estimatedCost });

      if (!mediaUrl) {
        console.error("No media URL in webhook payload:", resultPayload);
        await supabase
          .from("ai_social_content")
          .update({ 
            status: "failed",
            error_message: "No media URL returned from AI"
          })
          .eq("id", contentId);
        return new Response(JSON.stringify({ error: "No media URL" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Media generated: ${mediaUrl}`);

      // Get current metadata to preserve existing fields
      const existingMetadata = contentData?.metadata || {};

      // Update content record with estimated cost in metadata
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "completed",
          media_url: mediaUrl,
          thumbnail_url: mediaUrl,
          metadata: {
            ...existingMetadata,
            fal_cost: estimatedCost,
            fal_inference_time: inferenceTime,
            fal_metrics: metrics
          }
        })
        .eq("id", contentId);

      // Publish to configured platforms and track results
      const publishingResults: { platform: string; success: boolean; error?: string; postUrl?: string }[] = [];
      
      if (workflowId) {
        const igResult = await publishToInstagram(supabase, workflowId, mediaUrl, contentId);
        if (igResult.success === false) {
          publishingResults.push({ platform: 'instagram', success: false, error: igResult.error });
        } else if (igResult.postUrl) {
          publishingResults.push({ platform: 'instagram', success: true, postUrl: igResult.postUrl });
        }
        
        const liResult = await publishToLinkedin(supabase, workflowId, mediaUrl, contentId);
        if (liResult.success === false) {
          publishingResults.push({ platform: 'linkedin', success: false, error: liResult.error });
        } else if (liResult.postUrl) {
          publishingResults.push({ platform: 'linkedin', success: true, postUrl: liResult.postUrl });
        }
      }

      // Check if any publishing failed
      const failedPublishing = publishingResults.filter(r => !r.success);
      if (failedPublishing.length > 0) {
        // Update content with publishing failure info
        const { data: contentData } = await supabase
          .from("ai_social_content")
          .select("metadata")
          .eq("id", contentId)
          .single();
        
        const existingMetadata = contentData?.metadata || {};
        const errorMessages = failedPublishing.map(f => `${f.platform}: ${f.error}`).join("; ");
        
        await supabase
          .from("ai_social_content")
          .update({ 
            status: "failed",
            error_message: `Publishing failed: ${errorMessages}`,
            metadata: {
              ...existingMetadata,
              publishing_errors: failedPublishing
            }
          })
          .eq("id", contentId);
        
        console.log("Publishing failed for some platforms:", failedPublishing);
      }

      return new Response(JSON.stringify({ success: true, publishingResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (status === "FAILED" || status === "ERROR") {
      const errorMessage = resultPayload?.error || payload.error || "Generation failed";
      console.error("Generation failed:", errorMessage);

      await supabase
        .from("ai_social_content")
        .update({ 
          status: "failed",
          error_message: errorMessage
        })
        .eq("id", contentId);

      return new Response(JSON.stringify({ success: false, error: errorMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For IN_PROGRESS or other statuses, just acknowledge
    console.log(`Status update: ${status}`);
    return new Response(JSON.stringify({ acknowledged: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function publishToInstagram(supabase: any, workflowId: string, mediaUrl: string, contentId: string): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    // Get workflow to check platforms
    const { data: workflow } = await supabase
      .from("ai_social_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (!workflow || !workflow.platforms?.includes("instagram")) {
      console.log("Instagram not configured for this workflow");
      return { success: true }; // Not configured = skip, not failure
    }

    // Get Instagram credentials
    const { data: instagramData } = await supabase
      .from("api_keys")
      .select("api_key, owner_id")
      .eq("user_id", workflow.user_id)
      .eq("provider", "instagram")
      .maybeSingle();

    if (!instagramData) {
      console.log("No Instagram credentials found");
      return { success: false, error: "No Instagram credentials found" };
    }

    const accessToken = instagramData.api_key;
    const igUserId = instagramData.owner_id;
    const isVideo = workflow.content_type === "video";
    const caption = ""; // No caption for Instagram posts

    console.log(`Publishing ${isVideo ? 'video' : 'image'} to Instagram...`);

    let postUrl: string | null = null;
    if (isVideo) {
      postUrl = await publishVideoToInstagram(accessToken, igUserId, mediaUrl, caption);
    } else {
      postUrl = await publishImageToInstagram(accessToken, igUserId, mediaUrl, caption);
    }

    if (!postUrl) {
      return { success: false, error: "Failed to publish to Instagram" };
    }

    // Store post URL in content metadata
    const { data: contentData } = await supabase
      .from("ai_social_content")
      .select("metadata")
      .eq("id", contentId)
      .single();
    
    const existingMetadata = contentData?.metadata || {};
    await supabase
      .from("ai_social_content")
      .update({
        metadata: {
          ...existingMetadata,
          instagram_post_url: postUrl,
          instagram_published: true
        }
      })
      .eq("id", contentId);

    // Update workflow last_run_at
    await supabase
      .from("ai_social_workflows")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", workflowId);

    console.log("Instagram publishing completed successfully");
    return { success: true, postUrl };

  } catch (error) {
    console.error("Instagram publishing error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function publishImageToInstagram(accessToken: string, igUserId: string, imageUrl: string, caption: string): Promise<string | null> {
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
    return null;
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
    // Instagram post URL format
    return `https://www.instagram.com/p/${publishData.id}`;
  }
  return null;
}

async function publishVideoToInstagram(accessToken: string, igUserId: string, videoUrl: string, caption: string): Promise<string | null> {
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
    return null;
  }

  const containerData = await containerResponse.json();
  console.log("Video container created:", containerData.id);

  // Poll for container readiness
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
        return null;
      }
    }
    pollAttempts++;
  }

  if (!containerReady) {
    console.error("Timeout waiting for video container");
    return null;
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
    return `https://www.instagram.com/reel/${publishData.id}`;
  }
  return null;
}

async function publishToLinkedin(supabase: any, workflowId: string, mediaUrl: string, contentId: string): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    // Get workflow to check platforms
    const { data: workflow } = await supabase
      .from("ai_social_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (!workflow || !workflow.platforms?.includes("linkedin")) {
      console.log("LinkedIn not configured for this workflow");
      return { success: true }; // Not configured = skip, not failure
    }

    // Get LinkedIn credentials
    const { data: linkedinData } = await supabase
      .from("api_keys")
      .select("api_key, owner_id")
      .eq("user_id", workflow.user_id)
      .eq("provider", "linkedin")
      .maybeSingle();

    if (!linkedinData) {
      console.log("No LinkedIn credentials found");
      return { success: false, error: "No LinkedIn credentials found" };
    }

    const credentials = JSON.parse(linkedinData.api_key);
    const accessToken = credentials.access_token;
    // Construct proper URN format - owner_id is just the ID, need to add prefix
    const personId = linkedinData.owner_id;
    const personUrn = personId.startsWith("urn:li:person:") ? personId : `urn:li:person:${personId}`;
    const isVideo = workflow.content_type === "video";

    console.log(`Publishing ${isVideo ? 'video' : 'image'} to LinkedIn with URN: ${personUrn}`);

    let postUrl: string | null = null;
    if (isVideo) {
      postUrl = await publishVideoToLinkedin(accessToken, personUrn, mediaUrl);
    } else {
      postUrl = await publishImageToLinkedin(accessToken, personUrn, mediaUrl);
    }

    if (!postUrl) {
      return { success: false, error: "Failed to publish to LinkedIn" };
    }

    // Store post URL in content metadata
    const { data: contentData } = await supabase
      .from("ai_social_content")
      .select("metadata")
      .eq("id", contentId)
      .single();
    
    const existingMetadata = contentData?.metadata || {};
    await supabase
      .from("ai_social_content")
      .update({
        metadata: {
          ...existingMetadata,
          linkedin_post_url: postUrl,
          linkedin_published: true
        }
      })
      .eq("id", contentId);

    console.log("LinkedIn publishing completed successfully");
    return { success: true, postUrl };

  } catch (error) {
    console.error("LinkedIn publishing error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function publishImageToLinkedin(accessToken: string, personUrn: string, imageUrl: string): Promise<string | null> {
  // Step 1: Initialize upload
  const initResponse = await fetch("https://api.linkedin.com/v2/images?action=initializeUpload", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: personUrn
      }
    })
  });

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error("LinkedIn image upload init failed:", errorText);
    return null;
  }

  const initData = await initResponse.json();
  const uploadUrl = initData.value.uploadUrl;
  const imageAsset = initData.value.image;

  console.log("LinkedIn image upload URL obtained:", uploadUrl);

  // Step 2: Download image and upload to LinkedIn
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  const imageBuffer = await imageBlob.arrayBuffer();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream"
    },
    body: imageBuffer
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("LinkedIn image upload failed:", errorText);
    return null;
  }

  console.log("Image uploaded to LinkedIn, creating post...");

  // Step 3: Create post with the image
  const postResponse = await fetch("https://api.linkedin.com/v2/posts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify({
      author: personUrn,
      commentary: "",
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      content: {
        media: {
          title: "Generated content",
          id: imageAsset
        }
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    })
  });

  if (postResponse.ok) {
    const postId = postResponse.headers.get("x-restli-id");
    console.log("LinkedIn post published, ID:", postId);
    
    // Extract person ID from URN for post URL
    const personId = personUrn.replace("urn:li:person:", "");
    if (postId) {
      // LinkedIn post URL format
      return `https://www.linkedin.com/feed/update/${postId}`;
    }
    return null;
  } else {
    const errorText = await postResponse.text();
    console.error("LinkedIn post creation failed:", errorText);
    return null;
  }
}

async function publishVideoToLinkedin(accessToken: string, personUrn: string, videoUrl: string): Promise<string | null> {
  try {
    // Step 1: Download video to get size
    console.log(`Downloading video from: ${videoUrl}`);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      console.error(`Failed to download video: ${videoResponse.status}`);
      return null;
    }
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoSize = videoBuffer.byteLength;

    console.log(`LinkedIn video size: ${videoSize} bytes`);

    // Step 2: Initialize video upload
    console.log("Initializing LinkedIn video upload...");
    const initResponse = await fetch("https://api.linkedin.com/v2/videos?action=initializeUpload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: personUrn,
          fileSizeBytes: videoSize,
          uploadCaptions: false,
          uploadThumbnail: false
        }
      })
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error("LinkedIn video upload init failed:", errorText);
      return null;
    }

    const initData = await initResponse.json();
    console.log("LinkedIn init response:", JSON.stringify(initData, null, 2));
    
    const uploadInstructions = initData.value?.uploadInstructions;
    if (!uploadInstructions || uploadInstructions.length === 0) {
      console.error("No upload instructions in LinkedIn response");
      return null;
    }
    
    const uploadUrl = uploadInstructions[0]?.uploadUrl;
    const videoAsset = initData.value.video;

    if (!uploadUrl) {
      console.error("No upload URL in LinkedIn video init response");
      return null;
    }

    console.log("LinkedIn video upload URL obtained:", uploadUrl.substring(0, 100) + "...");

    // Step 3: Upload video with proper headers
    console.log("Uploading video to LinkedIn...");
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": videoSize.toString()
      },
      body: videoBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`LinkedIn video upload failed (${uploadResponse.status}):`, errorText.substring(0, 500));
      return null;
    }

    // Get the ETag from the upload response - required for finalize
    const etag = uploadResponse.headers.get("etag");
    console.log("LinkedIn video upload ETag:", etag);

    // Step 4: Finalize upload with the uploaded part info
    const finalizeResponse = await fetch("https://api.linkedin.com/v2/videos?action=finalizeUpload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        finalizeUploadRequest: {
          video: videoAsset,
          uploadToken: "",
          uploadedPartIds: etag ? [etag.replace(/"/g, '')] : []
        }
      })
    });

    if (!finalizeResponse.ok) {
      const errorText = await finalizeResponse.text();
      console.error("LinkedIn video finalize failed:", errorText);
      return null;
    }
    
    console.log("LinkedIn video finalize successful");

    // Step 5: Create post with the video
    console.log("Creating LinkedIn post with video...");
    const postResponse = await fetch("https://api.linkedin.com/v2/posts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: personUrn,
        commentary: "",
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        content: {
          media: {
            title: "Generated video",
            id: videoAsset
          }
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false
      })
    });

    if (postResponse.ok) {
      const postId = postResponse.headers.get("x-restli-id");
      console.log("LinkedIn video post published, ID:", postId);
      if (postId) {
        return `https://www.linkedin.com/feed/update/${postId}`;
      }
      return null;
    } else {
      const errorText = await postResponse.text();
      console.error("LinkedIn video post creation failed:", errorText);
      return null;
    }
  } catch (error) {
    console.error("LinkedIn video publishing error:", error);
    return null;
  }
}
