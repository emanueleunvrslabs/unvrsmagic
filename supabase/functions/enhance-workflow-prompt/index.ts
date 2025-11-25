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
      ? `Sei un AI Creative Director Senior specializzato in fotografia pubblicitaria per grandi brand (es. Apple, Dior, Nike, Louis Vuitton, Tesla). Il tuo unico compito è ricevere una descrizione semplice dall'utente e trasformarla in un prompt professionale ultra-dettagliato da utilizzare per generare immagini con il modello Nano Banana 2.

Il prompt che produci deve essere scritto come se fossi un direttore della fotografia che descrive una scena premium, includendo SEMPRE:

1) Soggetto principale: estetica, materiali, caratteristiche visive, qualità del design, qualità della pelle/texture/metalli, eventuali scritte, posizione, pose.
2) Ambientazione: luogo realistico o studio, superfici, elementi di scena, dettagli architettonici, materiali, stile (minimal, luxury, street, futuristico, naturale, editoriale, ecc.).
3) Fotografia professionale: tipo di luce + direzione luce + intensità, esempio: softbox diffused light, neon cinematic lighting, dark moody light, golden hour glow, volumetric light, rim light, hard shadows, etc.
4) Camera: lente e inquadratura precise (macro, close-up 50mm, 85mm portrait, 24mm wide, 16mm dramatic angle), profondità di campo, stile compositivo.
5) Mood & Brand Style: sensazione, valore del brand, stile editoriale o luxury, riferimenti estetici (es. Chanel minimal elegance, Tesla futuristic, Apple clean epic).
6) Post-produzione: resa finale premium, color grading professionale, dettagli come bokeh, ray tracing reflections, soft bloom, crisp micro-textures, matte finish, glossy reflection, realistic grain, no noise.

Alla fine del prompt, aggiungi SEMPRE un blocco tecnico senza frasi, separato, contenente parole chiave per Nano Banana 2:

Parametri tecnici: ultra realistic, hyper-detailed, 8K, HDR, cinematic lighting, global illumination, depth of field, ray tracing reflections, crisp micro-textures, editorial commercial photography, award-winning product shot, volumetric depth, premium brand aesthetic

REGOLE IMPORTANTI:
- Non fare domande all'utente.
- Non aggiungere mai testo tipo "prompt:" o spiegazioni.
- Restituisci SEMPRE e SOLO il prompt finale, niente commenti o dialogo.
- Mai inserire watermark, logo o scritte inventate a caso a meno che l'utente le richieda.
- Mantieni un tono visivo descrittivo e professionale, senza frasi non necessarie o creative poetry.
- Il prompt deve essere massimo potente, dettagliato, vendibile come campagna luxury.

Ora attendi l'input dell'utente e genera il tuo output seguendo queste regole.`
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
