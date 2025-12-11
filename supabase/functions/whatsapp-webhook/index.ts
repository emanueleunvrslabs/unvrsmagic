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

    console.log('Webhook payload received:', JSON.stringify(payload));

    // Process incoming messages - WASender uses "messages.received" event
    if (payload.event === 'messages.received') {
      const data = payload.data || {};
      // WASender format: data.key.remoteJid for phone, data.message.conversation for text
      const from = data.key?.remoteJid || data.from;
      const text = data.message?.conversation || data.message?.extendedTextMessage?.text || data.text;
      
      console.log('Processing incoming message from:', from, 'text:', text);
      
      if (from && text) {
        // Normalize phone number (remove @s.whatsapp.net suffix if present)
        const normalizedPhone = from.replace('@s.whatsapp.net', '').replace('@c.us', '');
        const phoneWithPlus = normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}`;
        
        console.log('Looking for contact with phone:', phoneWithPlus);
        
        // Find the contact by phone number (try with and without +)
        const { data: contact, error: contactError } = await supabase
          .from('client_contacts')
          .select('id, client_id, first_name, last_name, whatsapp_number')
          .or(`whatsapp_number.eq.${phoneWithPlus},whatsapp_number.eq.${normalizedPhone}`)
          .single();

        console.log('Contact lookup result:', contact, 'error:', contactError);

        if (contact) {
          // Get owner user_id
          const { data: ownerRole } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'owner')
            .single();

          // Save incoming message to database
          const { error: insertError } = await supabase
            .from('whatsapp_messages')
            .insert({
              client_id: contact.client_id,
              contact_id: contact.id,
              phone_number: contact.whatsapp_number,
              message_text: text,
              direction: 'incoming',
              status: 'received',
              user_id: ownerRole?.user_id
            });

          console.log('Message insert result:', insertError ? 'error: ' + insertError.message : 'success');
        } else {
          console.log('No contact found for phone number:', phoneWithPlus);
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
