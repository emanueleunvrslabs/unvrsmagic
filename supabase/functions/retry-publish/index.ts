import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { contentId, workflowId } = await req.json();

    if (!contentId || !workflowId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing contentId or workflowId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Retrying publish for content ${contentId}, workflow ${workflowId}`);

    // Get content details
    const { data: content, error: contentError } = await supabase
      .from("ai_social_content")
      .select("*")
      .eq("id", contentId)
      .eq("user_id", user.id)
      .single();

    if (contentError || !content) {
      return new Response(
        JSON.stringify({ success: false, error: "Content not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!content.media_url) {
      return new Response(
        JSON.stringify({ success: false, error: "Content has no media URL - generation may have failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from("ai_social_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError || !workflow) {
      return new Response(
        JSON.stringify({ success: false, error: "Workflow not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to indicate retry in progress
    await supabase
      .from("ai_social_content")
      .update({ 
        status: "publishing",
        error_message: null 
      })
      .eq("id", contentId);

    const platforms = workflow.platforms || [];
    const publishResults: { platform: string; success: boolean; postUrl?: string; error?: string }[] = [];

    // Get API credentials for publishing
    const { data: ownerRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .single();

    const ownerId = ownerRole?.user_id;

    // Publish to each platform
    for (const platform of platforms) {
      try {
        if (platform === "instagram") {
          const result = await publishToInstagram(supabase, content, ownerId);
          publishResults.push({ platform: "instagram", ...result });
        } else if (platform === "linkedin") {
          const result = await publishToLinkedin(supabase, content, user.id);
          publishResults.push({ platform: "linkedin", ...result });
        }
      } catch (error) {
        console.error(`Error publishing to ${platform}:`, error);
        publishResults.push({ 
          platform, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    // Determine final status
    const anySuccess = publishResults.some(r => r.success);
    const allSuccess = publishResults.every(r => r.success);
    const failedPlatforms = publishResults.filter(r => !r.success);

    const metadata = {
      ...(content.metadata || {}),
      retry_at: new Date().toISOString(),
      publishing_results: publishResults,
    };

    // Add post URLs to metadata
    for (const result of publishResults) {
      if (result.success && result.postUrl) {
        if (result.platform === "instagram") {
          metadata.instagram_post_url = result.postUrl;
          metadata.instagram_published = true;
        } else if (result.platform === "linkedin") {
          metadata.linkedin_post_url = result.postUrl;
          metadata.linkedin_published = true;
        }
      }
    }

    const finalStatus = allSuccess ? "completed" : (anySuccess ? "partial" : "failed");
    const errorMessage = failedPlatforms.length > 0 
      ? `Failed: ${failedPlatforms.map(p => `${p.platform} (${p.error})`).join(", ")}`
      : null;

    await supabase
      .from("ai_social_content")
      .update({ 
        status: finalStatus,
        error_message: errorMessage,
        metadata
      })
      .eq("id", contentId);

    console.log(`Retry completed for content ${contentId}. Status: ${finalStatus}`);

    return new Response(
      JSON.stringify({ 
        success: anySuccess, 
        status: finalStatus,
        results: publishResults 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Retry publish error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function publishToInstagram(
  supabase: any,
  content: any,
  ownerId: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  // Get Instagram credentials from owner's api_keys
  const { data: instagramKey } = await supabase
    .from("api_keys")
    .select("api_key, owner_id")
    .eq("user_id", ownerId)
    .eq("provider", "instagram")
    .single();

  if (!instagramKey?.api_key || !instagramKey?.owner_id) {
    return { success: false, error: "Instagram not configured" };
  }

  const accessToken = instagramKey.api_key;
  const instagramAccountId = instagramKey.owner_id;

  try {
    if (content.type === "image") {
      // Create image container
      const createResponse = await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: content.media_url,
            caption: content.metadata?.caption || "",
            access_token: accessToken,
          }),
        }
      );

      const createData = await createResponse.json();
      if (createData.error) {
        return { success: false, error: createData.error.message };
      }

      // Publish the container
      const publishResponse = await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: createData.id,
            access_token: accessToken,
          }),
        }
      );

      const publishData = await publishResponse.json();
      if (publishData.error) {
        return { success: false, error: publishData.error.message };
      }

      const postUrl = `https://www.instagram.com/p/${publishData.id}/`;
      return { success: true, postUrl };
    } else {
      // Video publishing (Reels)
      const createResponse = await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_type: "REELS",
            video_url: content.media_url,
            caption: content.metadata?.caption || "",
            access_token: accessToken,
          }),
        }
      );

      const createData = await createResponse.json();
      if (createData.error) {
        return { success: false, error: createData.error.message };
      }

      // Poll for completion
      let status = "IN_PROGRESS";
      let attempts = 0;
      while (status === "IN_PROGRESS" && attempts < 30) {
        await new Promise(r => setTimeout(r, 5000));
        const statusResponse = await fetch(
          `https://graph.facebook.com/v19.0/${createData.id}?fields=status_code&access_token=${accessToken}`
        );
        const statusData = await statusResponse.json();
        status = statusData.status_code;
        attempts++;
      }

      if (status !== "FINISHED") {
        return { success: false, error: `Video processing failed: ${status}` };
      }

      // Publish
      const publishResponse = await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: createData.id,
            access_token: accessToken,
          }),
        }
      );

      const publishData = await publishResponse.json();
      if (publishData.error) {
        return { success: false, error: publishData.error.message };
      }

      const postUrl = `https://www.instagram.com/reel/${publishData.id}/`;
      return { success: true, postUrl };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function publishToLinkedin(
  supabase: any,
  content: any,
  userId: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  // Get LinkedIn credentials
  const { data: linkedinKey } = await supabase
    .from("api_keys")
    .select("api_key, owner_id")
    .eq("user_id", userId)
    .eq("provider", "linkedin")
    .single();

  if (!linkedinKey?.api_key || !linkedinKey?.owner_id) {
    return { success: false, error: "LinkedIn not configured" };
  }

  // Parse the JSON credentials stored in api_key
  let accessToken: string;
  try {
    const credentials = JSON.parse(linkedinKey.api_key);
    accessToken = credentials.access_token;
    if (!accessToken) {
      return { success: false, error: "LinkedIn access token not found in credentials" };
    }
  } catch (e) {
    // Fallback: if api_key is not JSON, use it directly (legacy support)
    accessToken = linkedinKey.api_key;
  }
  
  const personUrn = `urn:li:person:${linkedinKey.owner_id}`;

  try {
    if (content.type === "image") {
      // Initialize image upload
      const initResponse = await fetch(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
              owner: personUrn,
              serviceRelationships: [
                {
                  relationshipType: "OWNER",
                  identifier: "urn:li:userGeneratedContent",
                },
              ],
            },
          }),
        }
      );

      const initData = await initResponse.json();
      if (!initData.value) {
        return { success: false, error: "Failed to initialize image upload" };
      }

      const uploadUrl = initData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
      const asset = initData.value.asset;

      // Download and upload image
      const imageResponse = await fetch(content.media_url);
      const imageBuffer = await imageResponse.arrayBuffer();

      // Upload image (upload URL is pre-signed, no Authorization header needed)
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "image/png",
        },
        body: imageBuffer,
      });

      if (!uploadResponse.ok) {
        return { success: false, error: "Failed to upload image to LinkedIn" };
      }

      // Create post
      const postResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: personUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: content.metadata?.caption || "" },
              shareMediaCategory: "IMAGE",
              media: [
                {
                  status: "READY",
                  media: asset,
                },
              ],
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });

      const postData = await postResponse.json();
      if (postData.id) {
        const activityId = postData.id.split(":").pop();
        const postUrl = `https://www.linkedin.com/feed/update/${postData.id}/`;
        return { success: true, postUrl };
      }

      return { success: false, error: postData.message || "Failed to create post" };
    } else {
      // Video publishing using v2/videos API
      const videoResponse = await fetch(content.media_url);
      const videoBuffer = await videoResponse.arrayBuffer();
      const videoSize = videoBuffer.byteLength;

      console.log(`LinkedIn video size: ${videoSize} bytes`);

      // Step 1: Initialize video upload
      const initResponse = await fetch(
        "https://api.linkedin.com/v2/videos?action=initializeUpload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            initializeUploadRequest: {
              owner: personUrn,
              fileSizeBytes: videoSize,
              uploadCaptions: false,
              uploadThumbnail: false
            },
          }),
        }
      );

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        console.error("LinkedIn video init failed:", errorText);
        return { success: false, error: `LinkedIn video init failed: ${errorText}` };
      }

      const initData = await initResponse.json();
      console.log("LinkedIn video initializeUpload response:", JSON.stringify(initData));
      
      const uploadUrl = initData.value?.uploadInstructions?.[0]?.uploadUrl;
      const videoAsset = initData.value?.video;

      if (!uploadUrl || !videoAsset) {
        console.error("No upload URL or video asset in LinkedIn response");
        return { success: false, error: "Failed to get upload URL from LinkedIn" };
      }

      console.log("LinkedIn video upload URL obtained");

      // Step 2: Upload video (upload URL is pre-signed, no Authorization header needed)
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: videoBuffer,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("LinkedIn video upload failed:", errorText);
        return { success: false, error: "Failed to upload video to LinkedIn" };
      }

      // Get the ETag from the upload response - required for finalize
      const etag = uploadResponse.headers.get("etag");
      console.log("LinkedIn video upload ETag:", etag);

      // Step 3: Finalize upload with the uploaded part info
      const finalizeResponse = await fetch(
        "https://api.linkedin.com/v2/videos?action=finalizeUpload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            finalizeUploadRequest: {
              video: videoAsset,
              uploadToken: "",
              uploadedPartIds: etag ? [etag.replace(/"/g, '')] : []
            },
          }),
        }
      );

      if (!finalizeResponse.ok) {
        const errorText = await finalizeResponse.text();
        console.error("LinkedIn video finalize failed:", errorText);
        return { success: false, error: `LinkedIn video finalize failed: ${errorText}` };
      }

      console.log("LinkedIn video finalize successful");

      // Step 4: Create post with the video
      const postResponse = await fetch("https://api.linkedin.com/v2/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: personUrn,
          commentary: content.metadata?.caption || "",
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
        }),
      });

      if (postResponse.ok) {
        const postId = postResponse.headers.get("x-restli-id");
        console.log("LinkedIn video post published, ID:", postId);
        if (postId) {
          return { success: true, postUrl: `https://www.linkedin.com/feed/update/${postId}` };
        }
        return { success: false, error: "Post created but no ID returned" };
      }

      const postError = await postResponse.text();
      console.error("LinkedIn video post creation failed:", postError);
      return { success: false, error: `Failed to create LinkedIn post: ${postError}` };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
