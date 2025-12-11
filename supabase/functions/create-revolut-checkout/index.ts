import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit packages available for purchase (in EUR cents)
const CREDIT_PACKAGES = [
  { id: "credits_10", amount: 10, price: 1000, label: "€10 Credits" },
  { id: "credits_50", amount: 50, price: 5000, label: "€50 Credits" },
  { id: "credits_100", amount: 100, price: 10000, label: "€100 Credits" },
  { id: "credits_250", amount: 250, price: 25000, label: "€250 Credits" },
  { id: "credits_500", amount: 500, price: 50000, label: "€500 Credits" },
  { id: "credits_1000", amount: 1000, price: 100000, label: "€1000 Credits" },
];

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

    const { packageId, returnUrl } = await req.json();

    // Find the package
    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      throw new Error("Invalid package selected");
    }

    // Get Revolut Merchant secret key from owner's database record
    // Owner user_id is fixed for platform credentials
    const OWNER_USER_ID = "9d8f65ef-58ef-47db-be8f-926f26411b39";
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: merchantKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("api_key")
      .eq("user_id", OWNER_USER_ID)
      .eq("provider", "revolut_merchant_secret")
      .single();

    if (keyError || !merchantKeyData) {
      throw new Error("Revolut Merchant credentials not configured");
    }

    const merchantSecretKey = merchantKeyData.api_key;
    
    // Production keys start with sk_, sandbox keys start with sandbox_sk_ or are from sandbox environment
    // Since the user has production keys (from business.revolut.com), use production endpoint
    const isSandbox = merchantSecretKey.startsWith("sandbox_");
    const apiBase = isSandbox 
      ? "https://sandbox-merchant.revolut.com/api/orders"
      : "https://merchant.revolut.com/api/orders";

    // Create unique order reference
    const orderRef = `credits_${user.id}_${Date.now()}`;

    // Get user email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone_number")
      .eq("user_id", user.id)
      .single();

    console.log("Creating Revolut order:", {
      amount: creditPackage.price,
      currency: "EUR",
      description: creditPackage.label,
      orderRef,
      isSandbox
    });

    // Create Revolut order
    const orderResponse = await fetch(apiBase, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${merchantSecretKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Revolut-Api-Version": "2024-09-01",
      },
      body: JSON.stringify({
        amount: creditPackage.price,
        currency: "EUR",
        description: `${creditPackage.amount} credits for AI content generation`,
        merchant_order_ext_ref: orderRef,
        customer_email: user.email,
        metadata: {
          user_id: user.id,
          credit_amount: creditPackage.amount.toString(),
          package_id: creditPackage.id,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("Revolut order creation failed:", orderData);
      throw new Error(orderData.message || "Failed to create payment order");
    }

    console.log("Revolut order created:", orderData.id);

    // Store order reference for webhook processing
    await supabaseAdmin
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: 0, // Will be updated on successful payment
        type: "purchase",
        description: `Pending: ${creditPackage.label}`,
        metadata: {
          revolut_order_id: orderData.id,
          order_ref: orderRef,
          package_id: creditPackage.id,
          credit_amount: creditPackage.amount,
          status: "pending",
        },
      });

    // Return checkout URL
    return new Response(
      JSON.stringify({ 
        url: orderData.checkout_url,
        orderId: orderData.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Revolut checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
