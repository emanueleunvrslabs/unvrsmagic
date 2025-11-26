import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HEYGEN_API_URL = 'https://api.heygen.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, avatarId, sessionId, text, sdpAnswer } = await req.json();
    console.log(`HeyGen session action: ${action}`, { avatarId, sessionId });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get owner's HeyGen API key
    const { data: ownerRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'owner')
      .single();

    if (!ownerRole) {
      return new Response(
        JSON.stringify({ error: 'Owner not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', ownerRole.user_id)
      .eq('provider', 'heygen')
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error('HeyGen API key not found:', apiKeyError);
      return new Response(
        JSON.stringify({ error: 'HeyGen API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const heygenApiKey = apiKeyData.api_key;

    if (action === 'start') {
      console.log('Starting HeyGen streaming session...');

      // Get the avatar details
      const { data: avatarData, error: avatarError } = await supabase
        .from('ai_avatars')
        .select('heygen_avatar_id, voice_id, opening_script')
        .eq('id', avatarId)
        .single();

      if (avatarError || !avatarData) {
        console.error('Avatar not found:', avatarError);
        return new Response(
          JSON.stringify({ error: 'Avatar not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 1: Get session token
      console.log('Getting HeyGen session token...');
      const tokenResponse = await fetch(`${HEYGEN_API_URL}/v1/streaming.create_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': heygenApiKey,
        },
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('HeyGen token error:', tokenResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to get session token', details: errorText }),
          { status: tokenResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await tokenResponse.json();
      const sessionToken = tokenData.data?.token;
      console.log('Session token obtained');

      // Step 2: Create streaming session (returns LiveKit credentials)
      console.log('Creating streaming session with avatar:', avatarData.heygen_avatar_id);
      const sessionResponse = await fetch(`${HEYGEN_API_URL}/v1/streaming.new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          quality: 'high',
          avatar_name: avatarData.heygen_avatar_id,
          voice: avatarData.voice_id ? {
            voice_id: avatarData.voice_id,
            rate: 1.0,
          } : undefined,
        }),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('HeyGen session error:', sessionResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to create streaming session', details: errorText }),
          { status: sessionResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sessionData = await sessionResponse.json();
      console.log('Streaming session created:', sessionData.data?.session_id);
      console.log('LiveKit URL:', sessionData.data?.url);

      // Update session with HeyGen details
      const { error: updateError } = await supabase
        .from('ai_live_sessions')
        .update({ 
          heygen_session_id: sessionData.data?.session_id,
          metadata: {
            session_token: sessionToken,
            livekit_url: sessionData.data?.url,
            access_token: sessionData.data?.access_token,
          }
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Failed to update session:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId: sessionData.data?.session_id,
          accessToken: sessionData.data?.access_token,
          livekitUrl: sessionData.data?.url,
          openingScript: avatarData.opening_script,
          sessionToken: sessionToken,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'start-session') {
      // Activate the HeyGen streaming session (required before speak commands)
      console.log('Activating HeyGen streaming session...');

      const { data: sessionData } = await supabase
        .from('ai_live_sessions')
        .select('heygen_session_id, metadata')
        .eq('id', sessionId)
        .single();

      if (!sessionData?.heygen_session_id || !sessionData?.metadata) {
        return new Response(
          JSON.stringify({ error: 'No session to start' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metadata = sessionData.metadata as { session_token?: string };

      // Start the streaming session (required for LiveKit mode)
      console.log('Calling streaming.start to activate session...');
      const startResponse = await fetch(`${HEYGEN_API_URL}/v1/streaming.start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${metadata.session_token}`,
        },
        body: JSON.stringify({
          session_id: sessionData.heygen_session_id,
        }),
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        console.error('HeyGen start error:', startResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to start streaming', details: errorText }),
          { status: startResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const startResult = await startResponse.json();
      console.log('Streaming session activated successfully:', startResult);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'stop') {
      console.log('Stopping HeyGen streaming session...');

      const { data: sessionData } = await supabase
        .from('ai_live_sessions')
        .select('heygen_session_id, metadata')
        .eq('id', sessionId)
        .single();

      if (!sessionData?.heygen_session_id) {
        console.log('No HeyGen session to stop');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metadata = sessionData.metadata as { session_token?: string };

      const response = await fetch(`${HEYGEN_API_URL}/v1/streaming.stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${metadata?.session_token}`,
        },
        body: JSON.stringify({
          session_id: sessionData.heygen_session_id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HeyGen stop error:', response.status, errorText);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'speak') {
      console.log('Making avatar speak:', text?.substring(0, 50));

      const { data: sessionData } = await supabase
        .from('ai_live_sessions')
        .select('heygen_session_id, metadata')
        .eq('id', sessionId)
        .single();

      if (!sessionData?.heygen_session_id) {
        return new Response(
          JSON.stringify({ error: 'No active session' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metadata = sessionData.metadata as { session_token?: string };

      const response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${metadata?.session_token}`,
        },
        body: JSON.stringify({
          session_id: sessionData.heygen_session_id,
          text: text,
          task_type: 'talk',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HeyGen speak error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to make avatar speak', details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in heygen-session function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});