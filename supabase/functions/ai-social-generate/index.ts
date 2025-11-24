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
    const { contentId, type, prompt, mode, inputImage } = await req.json();

    if (!contentId || !type || !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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
      ? "fal-ai/nano-banana/edit" 
      : "fal-ai/nano-banana-pro";

    console.log(`Generating ${type} with endpoint ${endpoint}, mode: ${mode}`);

    // Prepare request body
    const requestBody: any = {
      prompt: prompt,
    };

    // Add input image for image-to-image mode
    if (mode === "image-to-image" && inputImage) {
      requestBody.image_urls = [inputImage];
    }

    // Call Fal API
    const response = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: requestBody })
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
      const statusResponse = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}`, {
        headers: {
          "Authorization": `Key ${FAL_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to fetch status: ${await statusResponse.text()}`);
      }

      const statusData = await statusResponse.json();
      console.log(`Status check ${attempts + 1}: ${statusData.status}`);

      if (statusData.status === "COMPLETED") {
        resultData = statusData;
        break;
      } else if (statusData.status === "FAILED") {
        throw new Error(`Generation failed: ${JSON.stringify(statusData.error)}`);
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!resultData) {
      throw new Error("Timeout waiting for generation to complete");
    }

    // Extract image URL from the result
    const generatedImageUrl = resultData.output?.images?.[0]?.url;

    if (!generatedImageUrl) {
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
