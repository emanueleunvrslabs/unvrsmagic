import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('WASENDER_WEBHOOK_SECRET');
    
    if (signature !== webhookSecret) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();
    console.log('Received WhatsApp webhook:', JSON.stringify(payload, null, 2));

    // Process the webhook payload
    // This can be used to handle incoming messages, delivery reports, etc.
    
    if (payload.event === 'message.received') {
      const { from, message } = payload.data || {};
      console.log(`Message from ${from}: ${message?.text || 'No text'}`);
      
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
    console.error('Error in whatsapp-webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
