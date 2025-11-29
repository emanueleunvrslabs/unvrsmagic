import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendWhatsAppRequest {
  phoneNumber: string;
  message: string;
  clientId: string;
  contactId: string;
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

    // Get WASender API key from owner
    const { data: ownerData, error: ownerError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .single();

    if (ownerError || !ownerData) {
      throw new Error("Owner not found");
    }

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("user_id", ownerData.user_id)
      .eq("provider", "wasender")
      .single();

    if (apiKeyError || !apiKeyData) {
      throw new Error("WASender API key not found");
    }

    const { phoneNumber, message, clientId, contactId }: SendWhatsAppRequest = await req.json();

    // Send message via WASender API
    const wasenderResponse = await fetch("https://api.wasender.com/api/v1/message/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKeyData.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phoneNumber,
        message: message,
      }),
    });

    if (!wasenderResponse.ok) {
      const errorData = await wasenderResponse.json();
      throw new Error(errorData.message || "Failed to send WhatsApp message");
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
        message_text: message,
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
