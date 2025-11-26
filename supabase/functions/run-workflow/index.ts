import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate professional prompt using OpenAI
async function generateProfessionalPrompt(openaiKey: string, description: string, contentType: string): Promise<string> {
  const systemPrompt = contentType === "video" 
    ? `You are an expert video prompt engineer. Transform the user's description into a professional, detailed prompt for AI video generation. Include:
- Cinematic camera movements and angles
- Lighting atmosphere and mood
- Visual style and color grading
- Scene composition and framing
- Motion dynamics and pacing
- Audio/sound design suggestions if relevant
Keep the prompt concise but comprehensive. Output ONLY the enhanced prompt, no explanations.`
    : `You are an expert image prompt engineer. Transform the user's description into a professional, detailed prompt for AI image generation. Include:
- Professional lighting setup (natural, studio, dramatic, etc.)
- Camera angle and lens perspective
- Composition and framing
- Color palette and mood
- Texture and material details
- Style reference (photorealistic, cinematic, editorial, etc.)
Keep the prompt concise but comprehensive. Output ONLY the enhanced prompt, no explanations.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: description }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", errorText);
    throw new Error(`OpenAI API failed: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Check if user is admin/owner (unlimited credits)
    const { data: isOwner } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "owner"
    });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });
    const hasUnlimitedCredits = isOwner || isAdmin;

    // Check and deduct credits before generation (skip for admin/owner)
    const creditCost = workflow.content_type === "video" ? 10 : 1;
    
    if (!hasUnlimitedCredits) {
      const { data: credits } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentBalance = credits?.balance || 0;
      if (currentBalance < creditCost) {
        throw new Error(`Crediti insufficienti. Necessari: €${creditCost}, Disponibili: €${currentBalance.toFixed(2)}`);
      }
    }

    // Deduct credits
    const { data: deductResult, error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: creditCost,
      p_description: `${workflow.content_type === "video" ? "Video" : "Image"} generation - ${workflow.name}`,
      p_content_id: null
    });

    if (deductError || !deductResult) {
      console.error("Failed to deduct credits:", deductError);
      throw new Error("Impossibile dedurre i crediti");
    }

    console.log(`Deducted ${creditCost} credits for ${workflow.content_type} generation`);

    const { data: falKeyData } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("user_id", user.id)
      .eq("provider", "fal")
      .maybeSingle();

    if (!falKeyData) {
      throw new Error("Fal API key not found. Please configure it in AI Models API settings.");
    }

    const FAL_KEY = falKeyData.api_key;

    // Get OpenAI API key for prompt generation
    const { data: openaiKeyData } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("user_id", user.id)
      .eq("provider", "openai")
      .maybeSingle();

    if (!openaiKeyData) {
      throw new Error("OpenAI API key not found. Please configure it in AI Models API settings.");
    }

    // Generate professional prompt using OpenAI
    console.log("Generating professional prompt via OpenAI...");
    const professionalPrompt = await generateProfessionalPrompt(
      openaiKeyData.api_key,
      workflow.prompt_template,
      workflow.content_type
    );
    console.log("Professional prompt generated:", professionalPrompt.substring(0, 100) + "...");

    // Create content record with the professional prompt
    const contentTitle = workflow.name;
    const { data: content, error: contentError } = await supabase
      .from("ai_social_content")
      .insert({
        user_id: user.id,
        title: contentTitle,
        prompt: professionalPrompt,
        type: workflow.content_type,
        status: "generating",
        metadata: { 
          workflow_id: workflowId, 
          execution_type: "run_now",
          original_description: workflow.prompt_template
        }
      })
      .select()
      .single();

    if (contentError || !content) {
      throw new Error("Failed to create content record");
    }

    console.log("Content record created:", content.id);

    // Build webhook URL for Fal to call when generation completes
    const webhookUrl = `${supabaseUrl}/functions/v1/fal-webhook?contentId=${content.id}&workflowId=${workflowId}`;
    console.log("Webhook URL:", webhookUrl);

    try {
      const scheduleConfig = workflow.schedule_config || {};
      const isVideo = workflow.content_type === "video";
      
      // Queue the generation with webhook - returns immediately
      if (isVideo) {
        await queueVideoGeneration(FAL_KEY, professionalPrompt, scheduleConfig, webhookUrl);
      } else {
        await queueImageGeneration(FAL_KEY, professionalPrompt, scheduleConfig, webhookUrl);
      }

      // Return immediately - webhook will handle completion
      return new Response(
        JSON.stringify({ 
          success: true,
          contentId: content.id,
          status: "generating",
          message: "Generation started, polling for status..."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Generation queue error:", error);
      await supabase
        .from("ai_social_content")
        .update({ 
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error"
        })
        .eq("id", content.id);

      return new Response(
        JSON.stringify({ 
          success: false,
          contentId: content.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error in run-workflow:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Queue video generation with webhook as query parameter
async function queueVideoGeneration(falKey: string, prompt: string, scheduleConfig: any, webhookUrl: string): Promise<void> {
  const mode = scheduleConfig.generation_mode || "text-to-video";
  const aspectRatio = scheduleConfig.aspect_ratio || "16:9";
  const duration = scheduleConfig.duration || "8s";
  const generateAudio = scheduleConfig.generate_audio ?? true;

  console.log(`Queueing video with mode: ${mode}, aspect_ratio: ${aspectRatio}, duration: ${duration}`);

  // Use veo3.1 endpoints (not veo3)
  let endpoint = "fal-ai/veo3.1";
  const requestBody: any = {
    prompt: prompt,
    aspect_ratio: aspectRatio,
    duration: duration,
  };

  if (mode !== "image-to-video") {
    requestBody.generate_audio = generateAudio;
  }

  // Get reference image from either reference_image_url or image_urls (for backwards compatibility)
  const referenceImageUrl = scheduleConfig.reference_image_url || (scheduleConfig.image_urls?.length > 0 ? scheduleConfig.image_urls[0] : null);
  
  console.log(`Reference image URL exists: ${!!referenceImageUrl}, mode: ${mode}`);
  console.log(`image_urls length: ${scheduleConfig.image_urls?.length || 0}`);

  if (mode === "image-to-video" && scheduleConfig.image_urls?.length > 0) {
    endpoint = "fal-ai/veo3.1/image-to-video";
    requestBody.image_url = scheduleConfig.image_urls[0];
  } else if (mode === "reference-to-video" && referenceImageUrl) {
    endpoint = "fal-ai/veo3.1/reference-to-video";
    requestBody.reference_image_url = referenceImageUrl;
    requestBody.duration = "8s";
  } else if (mode === "first-last-frame" && (scheduleConfig.first_frame_url || scheduleConfig.first_frame_image) && (scheduleConfig.last_frame_url || scheduleConfig.last_frame_image)) {
    endpoint = "fal-ai/veo3.1/first-last-frame-to-video";
    requestBody.first_frame_url = scheduleConfig.first_frame_url || scheduleConfig.first_frame_image;
    requestBody.last_frame_url = scheduleConfig.last_frame_url || scheduleConfig.last_frame_image;
    requestBody.duration = "8s"; // First-last-frame only supports 8s duration
  }

  console.log(`Using endpoint: ${endpoint}`);

  // Pass webhook as query parameter fal_webhook
  const url = `https://queue.fal.run/${endpoint}?fal_webhook=${encodeURIComponent(webhookUrl)}`;
  console.log("Fal queue URL with webhook:", url);

  const response = await fetch(url, {
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
  console.log(`Fal video request queued with ID: ${queueData.request_id}`);
}

// Queue image generation with webhook as query parameter
async function queueImageGeneration(falKey: string, prompt: string, scheduleConfig: any, webhookUrl: string): Promise<void> {
  const mode = scheduleConfig.generation_mode || "text-to-image";
  const aspectRatio = scheduleConfig.aspect_ratio || "1:1";
  const resolution = scheduleConfig.resolution || "1K";
  const outputFormat = scheduleConfig.output_format || "jpeg";

  const endpoint = mode === "image-to-image" 
    ? "fal-ai/nano-banana-pro/edit" 
    : "fal-ai/nano-banana-pro";

  const requestBody: any = {
    prompt: prompt,
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

  console.log(`Queueing image generation with endpoint: ${endpoint}`);

  // Pass webhook as query parameter fal_webhook
  const url = `https://queue.fal.run/${endpoint}?fal_webhook=${encodeURIComponent(webhookUrl)}`;
  console.log("Fal queue URL with webhook:", url);

  const response = await fetch(url, {
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
  console.log(`Fal image request queued with ID: ${queueData.request_id}`);
}
