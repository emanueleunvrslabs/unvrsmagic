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

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process incoming messages
    if (payload.event === 'message.received') {
      const { from, text } = payload.data || {};
      
      if (from && text) {
        // Find the contact by phone number
        const { data: contact } = await supabase
          .from('client_contacts')
          .select('id, client_id, first_name, last_name')
          .eq('whatsapp_number', from)
          .single();

        if (contact) {
          // Save incoming message to database
          await supabase
            .from('whatsapp_messages')
            .insert({
              client_id: contact.client_id,
              contact_id: contact.id,
              phone_number: from,
              message_text: text,
              direction: 'incoming',
              status: 'received',
              user_id: (await supabase.from('user_roles').select('user_id').eq('role', 'owner').single()).data?.user_id
            });
        }
      }
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
