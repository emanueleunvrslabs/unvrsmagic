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

      // Update content record
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "completed",
          media_url: mediaUrl,
          thumbnail_url: mediaUrl
        })
        .eq("id", contentId);

      // If workflow has Instagram, publish
      if (workflowId) {
        await publishToInstagram(supabase, workflowId, mediaUrl, contentId);
      }

      return new Response(JSON.stringify({ success: true }), {
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

async function publishToInstagram(supabase: any, workflowId: string, mediaUrl: string, contentId: string) {
  try {
    // Get workflow to check platforms
    const { data: workflow } = await supabase
      .from("ai_social_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (!workflow || !workflow.platforms?.includes("instagram")) {
      console.log("Instagram not configured for this workflow");
      return;
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
      return;
    }

    const accessToken = instagramData.api_key;
    const igUserId = instagramData.owner_id;
    const isVideo = workflow.content_type === "video";
    const caption = ""; // No caption for Instagram posts

    console.log(`Publishing ${isVideo ? 'video' : 'image'} to Instagram...`);

    if (isVideo) {
      await publishVideoToInstagram(accessToken, igUserId, mediaUrl, caption);
    } else {
      await publishImageToInstagram(accessToken, igUserId, mediaUrl, caption);
    }

    // Update workflow last_run_at
    await supabase
      .from("ai_social_workflows")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", workflowId);

    console.log("Instagram publishing completed");

  } catch (error) {
    console.error("Instagram publishing error:", error);
  }
}

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
        return;
      }
    }
    pollAttempts++;
  }

  if (!containerReady) {
    console.error("Timeout waiting for video container");
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
