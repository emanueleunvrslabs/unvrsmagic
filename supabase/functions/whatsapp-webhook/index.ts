import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { timingSafeEqual } from "https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature using timing-safe comparison
    const signature = req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('WASENDER_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to Uint8Array for timing-safe comparison
    const sigBuffer = new TextEncoder().encode(signature);
    const secretBuffer = new TextEncoder().encode(webhookSecret);
    
    // Length check and timing-safe comparison
    if (sigBuffer.length !== secretBuffer.length || !timingSafeEqual(sigBuffer, secretBuffer)) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();

    // Process the webhook payload
    // This can be used to handle incoming messages, delivery reports, etc.
    
    if (payload.event === 'message.received') {
      const { from, message } = payload.data || {};
      
      // You can add custom logic here to handle incoming messages
      // For example, auto-replies, commands, etc.
    }

    return new Response(
      JSON.stringify({ success: true, received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
