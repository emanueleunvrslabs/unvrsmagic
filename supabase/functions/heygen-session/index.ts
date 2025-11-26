import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, avatarId, sessionId } = await req.json();

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
        .select('heygen_avatar_id, voice_id')
        .eq('id', avatarId)
        .single();

      if (avatarError || !avatarData) {
        return new Response(
          JSON.stringify({ error: 'Avatar not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create streaming session with HeyGen
      // Note: This is a simplified version - the actual HeyGen Streaming API
      // requires LiveKit integration and WebSocket connections
      const response = await fetch('https://api.heygen.com/v1/streaming.new', {
        method: 'POST',
        headers: {
          'X-Api-Key': heygenApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_id: avatarData.heygen_avatar_id,
          voice_id: avatarData.voice_id,
          quality: 'high',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HeyGen streaming error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to start streaming session' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const streamData = await response.json();
      console.log('HeyGen streaming session created:', streamData);

      // Update session with HeyGen session ID
      await supabase
        .from('ai_live_sessions')
        .update({ heygen_session_id: streamData.data?.session_id })
        .eq('id', sessionId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId: streamData.data?.session_id,
          accessToken: streamData.data?.access_token,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'stop') {
      console.log('Stopping HeyGen streaming session...');

      // Get the session's HeyGen session ID
      const { data: sessionData, error: sessionError } = await supabase
        .from('ai_live_sessions')
        .select('heygen_session_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData?.heygen_session_id) {
        console.log('No HeyGen session to stop');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Stop the HeyGen session
      const response = await fetch('https://api.heygen.com/v1/streaming.stop', {
        method: 'POST',
        headers: {
          'X-Api-Key': heygenApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionData.heygen_session_id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HeyGen stop error:', response.status, errorText);
        // Don't return error - session might already be stopped
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'speak') {
      // Make the avatar speak
      const { text } = await req.json();

      const { data: sessionData } = await supabase
        .from('ai_live_sessions')
        .select('heygen_session_id')
        .eq('id', sessionId)
        .single();

      if (!sessionData?.heygen_session_id) {
        return new Response(
          JSON.stringify({ error: 'No active session' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch('https://api.heygen.com/v1/streaming.task', {
        method: 'POST',
        headers: {
          'X-Api-Key': heygenApiKey,
          'Content-Type': 'application/json',
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
          JSON.stringify({ error: 'Failed to make avatar speak' }),
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
