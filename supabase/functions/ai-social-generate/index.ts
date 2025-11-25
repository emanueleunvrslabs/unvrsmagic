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
    const { contentId, type, prompt, mode, inputImages, aspectRatio, resolution, outputFormat, duration } = await req.json();

    if (!contentId || !type || !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "image-to-image" && (!inputImages || inputImages.length === 0)) {
      return new Response(
        JSON.stringify({ error: "At least one input image is required for image-to-image mode" }),
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

    // Get Fal API key from database
    console.log("Looking up Fal API key for user:", user.id);
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("user_id", user.id)
      .eq("provider", "fal")
      .maybeSingle();

    console.log("API key lookup result:", { found: !!apiKeyData, error: apiKeyError });

    if (apiKeyError) {
      console.error("Database error looking up Fal API key:", apiKeyError);
      throw new Error(`Database error: ${apiKeyError.message}`);
    }

    if (!apiKeyData) {
      throw new Error("Fal API key not found. Please configure it in AI Models API settings.");
    }

    const FAL_KEY = apiKeyData.api_key;

    // Update status to generating
    await supabase
      .from("ai_social_content")
      .update({ status: "generating" })
      .eq("id", contentId);

    // Determine the endpoint based on type and mode
    let endpoint: string;
    let baseEndpoint: string;
    
    if (type === "video") {
      // Video generation with Veo3.1
      endpoint = "fal-ai/veo3.1";
      baseEndpoint = "fal-ai/veo3.1";
    } else {
      // Image generation with Nano Banana Pro
      endpoint = mode === "image-to-image" 
        ? "fal-ai/nano-banana-pro/edit" 
        : "fal-ai/nano-banana-pro";
      baseEndpoint = "fal-ai/nano-banana-pro";
    }

    console.log(`Generating ${type} with endpoint ${endpoint}, mode: ${mode || 'text-to-video'}`);

    // Prepare request body
    let requestBody: any = {
      prompt: prompt
    };

    if (type === "video") {
      // Veo3.1 video generation parameters
      requestBody.aspect_ratio = aspectRatio || "16:9";
      requestBody.resolution = resolution || "720p";
      // Duration must be a string in format "4s", "6s", or "8s"
      if (duration) {
        requestBody.duration = duration; // Already in correct format from UI
      }
    } else {
      // Image generation parameters
      requestBody.num_images = 1;
      requestBody.output_format = outputFormat || "png";
      requestBody.resolution = resolution || "1K";

      // Add mode-specific parameters for images
      if (mode === "image-to-image") {
        requestBody.image_urls = inputImages;
        requestBody.aspect_ratio = aspectRatio || "auto";
      } else {
        requestBody.aspect_ratio = aspectRatio || "1:1";
      }
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
        .eq("id", contentId);

      return new Response(
        JSON.stringify({ error: "Fal API generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request ID from the queue response
    const queueData = await response.json();
    const requestId = queueData.request_id;

    if (!requestId) {
      throw new Error("No request_id returned from Fal API");
    }

    console.log(`Fal request queued with ID: ${requestId}`);

    // Poll for the result by directly checking the result endpoint
    // The /status endpoint returns 405 for this model, so we poll the result endpoint instead
    let resultData;
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds

    while (attempts < maxAttempts) {
      // Poll the result endpoint directly
      const resultResponse = await fetch(`https://queue.fal.run/${baseEndpoint}/requests/${requestId}`, {
        headers: {
          "Authorization": `Key ${FAL_KEY}`,
        },
      });

      console.log(`Poll attempt ${attempts + 1}, status: ${resultResponse.status}`);

      // If 200, the request is completed
      if (resultResponse.status === 200) {
        resultData = await resultResponse.json();
        console.log("Got completed result:", JSON.stringify(resultData));
        break;
      }
      
      // If 202, still processing
      if (resultResponse.status === 202) {
        const statusInfo = await resultResponse.json();
        console.log(`Request in progress:`, JSON.stringify(statusInfo));
        
        // Check if it failed
        if (statusInfo.status === "FAILED") {
          console.error("Generation failed:", statusInfo.error);
          throw new Error(`Generation failed: ${JSON.stringify(statusInfo.error)}`);
        }
      } else if (resultResponse.status !== 404) {
        // Unexpected status code (404 means not ready yet, which is normal)
        const errorText = await resultResponse.text();
        console.error(`Unexpected status ${resultResponse.status}:`, errorText);
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!resultData) {
      throw new Error("Timeout waiting for generation to complete");
    }

    // Extract media URL from the result
    console.log("Result data:", JSON.stringify(resultData));
    
    let generatedMediaUrl: string;
    let thumbnailUrl: string | undefined;

    if (type === "video") {
      // Video response structure: { video: { url: "..." } }
      generatedMediaUrl = resultData.video?.url;
      console.log("Extracted video URL:", generatedMediaUrl);
    } else {
      // Image response structure: { images: [{ url: "..." }] }
      generatedMediaUrl = resultData.images?.[0]?.url;
      thumbnailUrl = generatedMediaUrl;
      console.log("Extracted image URL:", generatedMediaUrl);
    }

    if (!generatedMediaUrl) {
      console.error("No media URL found in response:", JSON.stringify(resultData));
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "failed",
          error_message: `No ${type} URL returned from AI`
        })
        .eq("id", contentId);

      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update content with generated media
    const { error: updateError } = await supabase
      .from("ai_social_content")
      .update({ 
        status: "completed",
        media_url: generatedMediaUrl,
        thumbnail_url: thumbnailUrl || generatedMediaUrl
      })
      .eq("id", contentId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        mediaUrl: generatedMediaUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-social-generate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
