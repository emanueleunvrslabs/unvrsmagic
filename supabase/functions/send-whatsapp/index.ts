import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { corsHeaders } from '../_shared/cors.ts';

interface SendWhatsAppRequest {
  phoneNumber: string;
  message?: string;
  clientId: string;
  contactId: string;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video" | "audio";
  fileName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl) {
      console.error("SUPABASE_URL env variable is not set");
      throw new Error("SUPABASE_URL env variable is not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get WASender API key from Supabase secrets
    const wasenderApiKey = Deno.env.get('WASENDER_API_KEY');
    
    if (!wasenderApiKey) {
      throw new Error("WASender API key not configured");
    }

    const { phoneNumber, message, clientId, contactId, mediaUrl, mediaType, fileName }: SendWhatsAppRequest = await req.json();

    let wasenderResponse;
    let messageText = message || "";

    // Check if sending media or text
    if (mediaUrl && mediaType) {
      // Send media message via WASender API
      const mediaEndpoint = mediaType === "image" 
        ? "https://www.wasenderapi.com/api/send-image"
        : mediaType === "document"
        ? "https://www.wasenderapi.com/api/send-document"
        : mediaType === "video"
        ? "https://www.wasenderapi.com/api/send-video"
        : "https://www.wasenderapi.com/api/send-audio";

      const mediaBody: any = {
        to: phoneNumber,
        url: mediaUrl,
      };

      // Add caption for images/videos
      if ((mediaType === "image" || mediaType === "video") && message) {
        mediaBody.caption = message;
      }

      // Add filename for documents
      if (mediaType === "document" && fileName) {
        mediaBody.filename = fileName;
      }

      console.log(`Sending ${mediaType} to ${phoneNumber}:`, mediaBody);

      wasenderResponse = await fetch(mediaEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${wasenderApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mediaBody),
      });

      // Update message text to include media info
      if (!message) {
        messageText = `[${mediaType.toUpperCase()}] ${fileName || "Media"}`;
      }
    } else {
      // Send text message via WASender API
      wasenderResponse = await fetch("https://www.wasenderapi.com/api/send-message", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${wasenderApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          text: message,
        }),
      });
    }

    if (!wasenderResponse.ok) {
      const errorText = await wasenderResponse.text();
      console.error("WASender API error:", errorText);
      throw new Error(`Failed to send WhatsApp message: ${errorText}`);
    }

    const wasenderData = await wasenderResponse.json();

    // Save message to database
    const { data: savedMessage, error: saveError } = await supabase
      .from("whatsapp_messages")
      .insert({
        user_id: user.id,
        client_id: clientId,
        contact_id: contactId,
        phone_number: phoneNumber,
        message_text: messageText,
        direction: "outgoing",
        status: "sent",
        message_id: wasenderData.message_id || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving message:", saveError);
      throw saveError;
    }

    return new Response(JSON.stringify(savedMessage), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-whatsapp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);