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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Get Revolut Merchant secret key from user's database record
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: merchantKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("api_key")
      .eq("user_id", user.id)
      .eq("provider", "revolut_merchant_secret")
      .single();

    if (keyError || !merchantKeyData) {
      throw new Error("Revolut Merchant credentials not configured");
    }

    const merchantSecretKey = merchantKeyData.api_key;
    
    // Determine if sandbox or production based on key prefix
    const isSandbox = merchantSecretKey.startsWith("sk_");
    const apiBase = isSandbox 
      ? "https://sandbox-merchant.revolut.com/api/1.0/webhooks"
      : "https://merchant.revolut.com/api/1.0/webhooks";

    const webhookUrl = `${supabaseUrl}/functions/v1/revolut-webhook`;

    console.log("Registering Revolut webhook:", { webhookUrl, isSandbox });

    // Register webhook for ORDER_COMPLETED event
    const response = await fetch(apiBase, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantSecretKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Revolut-Api-Version": "2024-09-01",
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ["ORDER_COMPLETED", "ORDER_PAYMENT_FAILED"],
      }),
    });

    const webhookData = await response.json();

    if (!response.ok) {
      console.error("Webhook registration failed:", webhookData);
      throw new Error(webhookData.message || "Failed to register webhook");
    }

    console.log("Webhook registered successfully:", webhookData);

    // Save the signing secret for webhook verification
    if (webhookData.signing_secret) {
      await supabaseAdmin
        .from("api_keys")
        .upsert({
          user_id: user.id,
          provider: "revolut_webhook_secret",
          api_key: webhookData.signing_secret,
          owner_id: null,
        }, {
          onConflict: "user_id,provider"
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        webhookId: webhookData.id,
        message: "Webhook registered successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Register webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
