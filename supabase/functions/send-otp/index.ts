import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number format (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number length
    if (phoneNumber.length < 8 || phoneNumber.length > 16) {
      return new Response(
        JSON.stringify({ error: 'Phone number length must be between 8 and 16 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clean up old unverified OTP codes for this phone number
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('phone_number', phoneNumber)
      .eq('verified', false);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        phone_number: phoneNumber,
        code: otp,
        expires_at: expiresAt,
        verified: false
      });

    if (dbError) {
      throw new Error('Failed to save OTP');
    }

    // Send OTP via Wasender WhatsApp API
    const wasenderApiKey = Deno.env.get('WASENDER_API_KEY');
    const wasenderApiSecret = Deno.env.get('WASENDER_API_SECRET');
    
    if (!wasenderApiKey || !wasenderApiSecret) {
      throw new Error('Wasender API credentials not configured');
    }
    
    const message = `Il tuo codice di verifica è: ${otp}\n\nQuesto codice scadrà tra 10 minuti.`;
    
    const wasenderResponse = await fetch('https://api.wasender.it/api/v1/message/send-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wasenderApiKey}`,
        'X-API-Secret': wasenderApiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        text: message
      }),
    });

    if (!wasenderResponse.ok) {
      throw new Error('Failed to send WhatsApp message');
    }

    const wasenderData = await wasenderResponse.json();
    console.log('OTP sent successfully via WhatsApp:', wasenderData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OTP sent successfully',
        expiresAt 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-otp function:', error);
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
