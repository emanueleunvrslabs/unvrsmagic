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
    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone number and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpData) {
      console.error('OTP verification failed:', otpError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as verified
    await supabaseAdmin
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpData.id);

    // Check if user exists with this phone number
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;
    let email: string;
    let tempPassword: string;

    if (existingProfile) {
      // Existing user
      userId = existingProfile.user_id;
      email = `${phoneNumber.replace(/\+/g, '')}@phone.auth`;
      
      // Generate temporary password for login
      tempPassword = crypto.randomUUID();
      
      // Update user password
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });
    } else {
      // New user - create auth user and profile
      isNewUser = true;
      
      email = `${phoneNumber.replace(/\+/g, '')}@phone.auth`;
      tempPassword = crypto.randomUUID();
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          phone_number: phoneNumber,
        }
      });

      if (authError || !authData.user) {
        console.error('Auth user creation error:', authError);
        throw new Error('Failed to create user account');
      }

      userId = authData.user.id;

      // Create profile without username
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create user profile');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        isNewUser,
        email,
        tempPassword,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in verify-otp function:', error);
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
