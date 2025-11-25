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

    console.log("Workflow found:", workflow.name);

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
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fal API error:", response.status, errorText);
      
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "failed",
          error_message: `Fal API generation failed: ${errorText}`
        })
        .eq("id", content.id);

      throw new Error(`Fal API generation failed: ${errorText}`);
    }

    // Get the request ID from the queue response
    const queueData = await response.json();
    const requestId = queueData.request_id;

    if (!requestId) {
      throw new Error("No request_id returned from Fal API");
    }

    console.log(`Fal request queued with ID: ${requestId}`);

    // Poll for result (in foreground since this is a user-initiated action)
    let resultData;
    let attempts = 0;
    const maxAttempts = 150; // Wait up to 5 minutes

    while (attempts < maxAttempts) {
      const resultResponse = await fetch(`https://queue.fal.run/${pollingEndpoint}/requests/${requestId}`, {
        headers: {
          "Authorization": `Key ${FAL_KEY}`,
        },
      });

      console.log(`Poll attempt ${attempts + 1}, status: ${resultResponse.status}`);

      if (resultResponse.status === 200) {
        resultData = await resultResponse.json();
        console.log("Got completed result");
        break;
      }
      
      if (resultResponse.status === 202) {
        const statusInfo = await resultResponse.json();
        if (statusInfo.status === "FAILED") {
          throw new Error(`Generation failed: ${JSON.stringify(statusInfo.error)}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    if (!resultData) {
      throw new Error("Timeout waiting for generation to complete");
    }

    // Extract image URL
    const generatedImageUrl = resultData.images?.[0]?.url;

    if (!generatedImageUrl) {
      throw new Error("No image URL returned from AI");
    }

    console.log("Image generated:", generatedImageUrl);

    // Update content record with generated image
    await supabase
      .from("ai_social_content")
      .update({ 
        status: "completed",
        media_url: generatedImageUrl,
        thumbnail_url: generatedImageUrl
      })
      .eq("id", content.id);

    // Post to Instagram if connected
    let instagramPostResult = null;
    if (hasInstagram && instagramData) {
      console.log("Publishing to Instagram...");
      
      try {
        const accessToken = instagramData.api_key;
        const igUserId = instagramData.owner_id;

        // Step 1: Create media container
        const containerResponse = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}/media`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image_url: generatedImageUrl,
              caption: workflow.description || workflow.prompt_template.substring(0, 200) + "...",
              access_token: accessToken,
            }),
          }
        );

        if (!containerResponse.ok) {
          const errorText = await containerResponse.text();
          console.error("Instagram container creation failed:", errorText);
          instagramPostResult = { error: errorText };
        } else {
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
            instagramPostResult = { error: errorText };
          } else {
            const publishData = await publishResponse.json();
            console.log("Instagram post published:", publishData.id);
            instagramPostResult = { success: true, postId: publishData.id };
          }
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
        imageUrl: generatedImageUrl,
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
