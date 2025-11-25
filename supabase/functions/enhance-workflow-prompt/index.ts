import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, workflowType } = await req.json();
    
    if (!description) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = workflowType === "image" 
      ? `You are an expert prompt engineer for AI image generation, specifically for the Nano Banana (Google Gemini image model). 
Your task is to transform user descriptions into professional, detailed prompts that will generate high-quality images.

Guidelines:
- Add specific artistic style, lighting, and composition details
- Include technical photography terms when appropriate (bokeh, golden hour, rule of thirds, etc.)
- Specify mood, atmosphere, and color palette
- Add quality enhancers like "highly detailed", "professional", "8K resolution"
- Keep the core intent of the user's description
- Output ONLY the enhanced prompt, no explanations

Example:
User: "a cat sitting on a couch"
Enhanced: "A majestic tabby cat with emerald eyes lounging gracefully on a vintage velvet couch, warm golden hour lighting streaming through a nearby window, shallow depth of field creating soft bokeh in the background, professional pet photography, highly detailed fur texture, cozy home interior aesthetic, 8K resolution"`
      : `You are an expert prompt engineer for AI video generation (Veo3.1 model).
Your task is to transform user descriptions into professional, detailed prompts that will generate high-quality videos.

Guidelines:
- Add specific motion and action details
- Include camera movement suggestions (pan, zoom, tracking shot, etc.)
- Specify lighting transitions and atmospheric changes
- Add cinematic quality terms
- Keep the core intent of the user's description
- Output ONLY the enhanced prompt, no explanations`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transform this description into a professional AI ${workflowType} generation prompt:\n\n"${description}"` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content?.trim() || description;

    return new Response(
      JSON.stringify({ enhancedPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
