import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentId, type, prompt, mode, inputImages, firstFrameImage, lastFrameImage, aspectRatio, resolution, outputFormat, duration, generateAudio } = await req.json();

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

    const creditCost = type === "video" ? 10 : 1;

    // FIRST: Get owner's API key (all users use owner's keys and pay service costs)
    console.log("Looking up owner's Fal API key...");
    
    // Find the owner's user_id
    const { data: ownerRole, error: ownerError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .maybeSingle();

    if (ownerError) {
      console.error("Error finding owner:", ownerError);
      return new Response(
        JSON.stringify({ error: "System configuration error. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ownerRole) {
      return new Response(
        JSON.stringify({ error: "Platform owner not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("user_id", ownerRole.user_id)
      .eq("provider", "fal")
      .maybeSingle();

    if (apiKeyError) {
      console.error("Error looking up owner's Fal API key:", apiKeyError);
      return new Response(
        JSON.stringify({ error: "Database error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiKeyData) {
      return new Response(
        JSON.stringify({ error: "Service not configured. Please contact support." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Using owner's Fal API key");
    const FAL_KEY = apiKeyData.api_key;

    // SECOND: Check credits (but don't deduct yet)
    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentBalance = credits?.balance || 0;
    if (currentBalance < creditCost) {
      return new Response(
        JSON.stringify({ error: `Crediti insufficienti. Necessari: €${creditCost}, Disponibili: €${currentBalance.toFixed(2)}` }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to generating (no credits deducted yet)
    await supabase
      .from("ai_social_content")
      .update({ status: "generating" })
      .eq("id", contentId);

    // Determine the endpoint based on type and mode
    let endpoint: string;
    let pollingEndpoint: string;
    
    if (type === "video") {
      if (mode === "image-to-video") {
        endpoint = "fal-ai/veo3.1/image-to-video";
        pollingEndpoint = "fal-ai/veo3.1";
      } else if (mode === "reference-to-video") {
        endpoint = "fal-ai/veo3.1/reference-to-video";
        pollingEndpoint = "fal-ai/veo3.1";
      } else if (mode === "first-last-frame") {
        endpoint = "fal-ai/veo3.1/first-last-frame-to-video";
        pollingEndpoint = "fal-ai/veo3.1";
      } else {
        endpoint = "fal-ai/veo3.1";
        pollingEndpoint = "fal-ai/veo3.1";
      }
    } else {
      endpoint = mode === "image-to-image" 
        ? "fal-ai/nano-banana-pro/edit" 
        : "fal-ai/nano-banana-pro";
      pollingEndpoint = "fal-ai/nano-banana-pro";
    }

    console.log(`Generating ${type} with endpoint ${endpoint}, mode: ${mode || 'text-to-video'}`);

    // Prepare request body
    let requestBody: any = {
      prompt: prompt
    };

    if (type === "video") {
      if (mode === "first-last-frame") {
        requestBody.aspect_ratio = aspectRatio || "16:9";
        requestBody.resolution = resolution || "720p";
        requestBody.duration = duration || "6s";
        requestBody.generate_audio = generateAudio !== undefined ? generateAudio : true;
        if (firstFrameImage) {
          requestBody.first_frame_url = firstFrameImage;
        }
        if (lastFrameImage) {
          requestBody.last_frame_url = lastFrameImage;
        }
      } else if (mode === "reference-to-video") {
        requestBody.resolution = resolution || "720p";
        requestBody.duration = "8s";
        requestBody.generate_audio = generateAudio !== undefined ? generateAudio : true;
        if (inputImages && inputImages.length > 0) {
          requestBody.image_urls = inputImages;
        }
      } else {
        requestBody.aspect_ratio = aspectRatio || "16:9";
        requestBody.resolution = resolution || "720p";
        if (duration) {
          requestBody.duration = duration;
        }
        requestBody.generate_audio = generateAudio !== undefined ? generateAudio : true;
        if (mode === "image-to-video" && inputImages && inputImages.length > 0) {
          requestBody.image_url = inputImages[0];
        }
      }
    } else {
      requestBody.num_images = 1;
      requestBody.output_format = outputFormat || "png";
      requestBody.resolution = resolution || "1K";
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
      
      // DON'T deduct credits - API call failed
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "failed",
          error_message: `Fal API generation failed: ${errorText}`
        })
        .eq("id", contentId);

      return new Response(
        JSON.stringify({ error: "Fal API generation failed. No credits deducted." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request ID from the queue response
    const queueData = await response.json();
    const requestId = queueData.request_id;

    if (!requestId) {
      // DON'T deduct credits - no request ID
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "failed",
          error_message: "No request_id returned from Fal API"
        })
        .eq("id", contentId);
      
      return new Response(
        JSON.stringify({ error: "No request_id returned from Fal API. No credits deducted." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fal request queued with ID: ${requestId}`);

    // Poll for the result in background
    const pollAndUpdate = async () => {
      let resultData;
      let attempts = 0;
      const maxAttempts = 300;

      while (attempts < maxAttempts) {
        const resultResponse = await fetch(`https://queue.fal.run/${pollingEndpoint}/requests/${requestId}`, {
          headers: {
            "Authorization": `Key ${FAL_KEY}`,
          },
        });

        console.log(`Poll attempt ${attempts + 1}, status: ${resultResponse.status}`);

        if (resultResponse.status === 200) {
          resultData = await resultResponse.json();
          console.log("Got completed result:", JSON.stringify(resultData));
          break;
        }
        
        if (resultResponse.status === 202) {
          const statusInfo = await resultResponse.json();
          console.log(`Request in progress:`, JSON.stringify(statusInfo));
          
          if (statusInfo.status === "FAILED") {
            console.error("Generation failed:", statusInfo.error);
            // DON'T deduct credits - generation failed
            await supabase
              .from("ai_social_content")
              .update({ 
                status: "failed",
                error_message: `Generation failed: ${JSON.stringify(statusInfo.error)}`
              })
              .eq("id", contentId);
            return;
          }
        } else if (resultResponse.status !== 404) {
          const errorText = await resultResponse.text();
          console.error(`Unexpected status ${resultResponse.status}:`, errorText);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (!resultData) {
        console.error("Timeout waiting for generation to complete");
        // DON'T deduct credits - timeout
        await supabase
          .from("ai_social_content")
          .update({ 
            status: "failed",
            error_message: "Timeout waiting for generation to complete"
          })
          .eq("id", contentId);
        return;
      }

      // Extract media URL from the result
      console.log("Result data:", JSON.stringify(resultData));
      
      let generatedMediaUrl: string;
      let thumbnailUrl: string | undefined;

      if (type === "video") {
        generatedMediaUrl = resultData.video?.url;
        thumbnailUrl = resultData.video?.thumbnail_url;
        console.log("Extracted video URL:", generatedMediaUrl);
        console.log("Extracted video thumbnail URL:", thumbnailUrl);
      } else {
        generatedMediaUrl = resultData.images?.[0]?.url;
        thumbnailUrl = generatedMediaUrl;
        console.log("Extracted image URL:", generatedMediaUrl);
      }

      if (!generatedMediaUrl) {
        console.error("No media URL found in response:", JSON.stringify(resultData));
        // DON'T deduct credits - no media URL
        await supabase
          .from("ai_social_content")
          .update({ 
            status: "failed",
            error_message: `No ${type} URL returned from AI`
          })
          .eq("id", contentId);
        return;
      }

      // SUCCESS! Now deduct credits
      console.log(`Generation successful! Deducting ${creditCost} credits for ${type} generation`);
      
      const { data: deductResult, error: deductError } = await supabase.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: creditCost,
        p_description: `${type === "video" ? "Video" : "Image"} generation`,
        p_content_id: contentId
      });

      if (deductError) {
        console.error("Failed to deduct credits (but generation succeeded):", deductError);
        // Still update the content as successful - just log the credit error
      } else {
        console.log(`Successfully deducted ${creditCost} credits`);
      }

      // Format duration for display
      let metadata: any = {};
      if (type === "video" && duration) {
        const seconds = parseInt(duration.replace('s', ''));
        const formattedDuration = `0:${seconds.toString().padStart(2, '0')}`;
        metadata.duration = formattedDuration;
      }
      
      // Add cost to metadata
      metadata.cost = creditCost;

      // Update content with generated media
      const { error: updateError } = await supabase
        .from("ai_social_content")
        .update({ 
          status: "completed",
          media_url: generatedMediaUrl,
          thumbnail_url: thumbnailUrl || generatedMediaUrl,
          metadata: metadata
        })
        .eq("id", contentId);

      if (updateError) {
        console.error("Database update error:", updateError);
      } else {
        console.log("Successfully updated content with media URL");
      }
    };

    // Start background polling (non-blocking)
    pollAndUpdate().catch(err => {
      console.error("Background polling error:", err);
    });

    // Return immediately to allow user to navigate away
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Generation started. Credits will be deducted only if successful.",
        contentId
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
