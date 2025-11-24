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
    const { contentId, type, prompt, mode, inputImages, aspectRatio, resolution, outputFormat } = await req.json();

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

    // Determine the endpoint based on mode
    const endpoint = mode === "image-to-image" 
      ? "fal-ai/nano-banana-pro/edit" 
      : "fal-ai/nano-banana-pro";
    
    // For status checking, use base endpoint without subpath
    const baseEndpoint = "fal-ai/nano-banana-pro";

    console.log(`Generating ${type} with endpoint ${endpoint}, mode: ${mode}`);

    // Prepare request body
    const requestBody: any = {
      prompt: prompt,
      num_images: 1,
      output_format: outputFormat || "png",
      resolution: resolution || "1K"
    };

    // Add mode-specific parameters
    if (mode === "image-to-image") {
      // For image-to-image, use image_urls array (required parameter)
      // Can accept multiple images
      requestBody.image_urls = inputImages;
      // Include aspect_ratio (defaults to "auto" but can be specified)
      requestBody.aspect_ratio = aspectRatio || "auto";
    } else {
      // For text-to-image, include aspect_ratio
      requestBody.aspect_ratio = aspectRatio || "1:1";
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

    // Poll for the result
    let resultData;
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds

    while (attempts < maxAttempts) {
      // Poll the status endpoint - use baseEndpoint without subpath
      const statusResponse = await fetch(`https://queue.fal.run/${baseEndpoint}/requests/${requestId}/status`, {
        headers: {
          "Authorization": `Key ${FAL_KEY}`,
        },
      });

      const statusText = await statusResponse.text();
      let statusData;
      
      try {
        statusData = JSON.parse(statusText);
      } catch (e) {
        console.error(`Failed to parse status response: ${statusText}`);
        throw new Error(`Invalid status response: ${statusText}`);
      }

      console.log(`Status check ${attempts + 1}:`, JSON.stringify(statusData));

      // Check if request is completed
      if (statusData.status === "COMPLETED") {
        // Fetch the actual result - use baseEndpoint without subpath
        const resultResponse = await fetch(`https://queue.fal.run/${baseEndpoint}/requests/${requestId}`, {
          headers: {
            "Authorization": `Key ${FAL_KEY}`,
          },
        });

        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch result: ${await resultResponse.text()}`);
        }

        resultData = await resultResponse.json();
        console.log("Got completed result:", JSON.stringify(resultData));
        break;
      } else if (statusData.status === "FAILED") {
        console.error("Generation failed with error:", statusData.error);
        throw new Error(`Generation failed: ${JSON.stringify(statusData.error)}`);
      } else if (statusData.status === "IN_PROGRESS" || statusData.status === "IN_QUEUE") {
        console.log(`Request ${statusData.status}, attempt ${attempts + 1}/${maxAttempts}`);
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!resultData) {
      throw new Error("Timeout waiting for generation to complete");
    }

    // Extract image URL from the result
    console.log("Result data:", JSON.stringify(resultData));
    
    // The response structure is { images: [{ url: "...", ... }] }
    const generatedImageUrl = resultData.images?.[0]?.url;

    console.log("Extracted image URL:", generatedImageUrl);

    if (!generatedImageUrl) {
      console.error("No image URL found in response:", JSON.stringify(resultData));
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "failed",
          error_message: "No image URL returned from AI"
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
        media_url: generatedImageUrl,
        thumbnail_url: generatedImageUrl
      })
      .eq("id", contentId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        mediaUrl: generatedImageUrl
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
