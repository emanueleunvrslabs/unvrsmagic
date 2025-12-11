import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, sessionId, platforms } = await req.json();

    // Get owner's Restream API key
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

    const { data: restreamKey, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', ownerRole.user_id)
      .eq('provider', 'restream')
      .single();

    if (keyError || !restreamKey) {
      console.error('Restream API key not found:', keyError);
      return new Response(
        JSON.stringify({ error: 'Restream API key not configured. Please configure it in Settings → Security → API Access.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = restreamKey.api_key;

    switch (action) {
      case 'get-whip-url': {
        // Get WHIP endpoint from Restream
        console.log('Fetching WHIP endpoint from Restream...');
        
        try {
          // First, get user profile to check account
          const profileResponse = await fetch('https://api.restream.io/v2/user/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            console.error('Restream profile error:', profileResponse.status, errorText);
            return new Response(
              JSON.stringify({ error: 'Failed to authenticate with Restream', details: errorText }),
              { status: profileResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const profile = await profileResponse.json();
          console.log('Restream user profile:', profile.username);

          // Get streaming channels/platforms
          const channelsResponse = await fetch('https://api.restream.io/v2/user/channel-set', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!channelsResponse.ok) {
            const errorText = await channelsResponse.text();
            console.error('Restream channels error:', channelsResponse.status, errorText);
          } else {
            const channels = await channelsResponse.json();
            console.log('Restream channels:', JSON.stringify(channels).substring(0, 500));
          }

          // Get WHIP ingest URL
          // Note: Restream's WHIP is available at: wss://whip.restream.io/whip
          // Or via their ingest API
          const ingestResponse = await fetch('https://api.restream.io/v2/user/ingest', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!ingestResponse.ok) {
            const errorText = await ingestResponse.text();
            console.error('Restream ingest error:', ingestResponse.status, errorText);
            return new Response(
              JSON.stringify({ error: 'Failed to get Restream ingest info', details: errorText }),
              { status: ingestResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const ingestData = await ingestResponse.json();
          console.log('Restream ingest data:', JSON.stringify(ingestData).substring(0, 500));

          // Construct WHIP URL
          // Restream WHIP endpoint format: https://live.restream.io/whip/{stream_key}
          const streamKey = ingestData.streamKey || ingestData.stream_key;
          const whipUrl = `https://live.restream.io/whip/${streamKey}`;

          return new Response(
            JSON.stringify({
              success: true,
              whipUrl,
              rtmpUrl: ingestData.rtmpUrl || ingestData.rtmp_url,
              streamKey,
              username: profile.username,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Error getting WHIP URL:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to get Restream WHIP URL', details: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get-channels': {
        // Get connected platforms/channels
        const channelsResponse = await fetch('https://api.restream.io/v2/user/channel-set', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!channelsResponse.ok) {
          const errorText = await channelsResponse.text();
          console.error('Restream channels error:', channelsResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to get Restream channels', details: errorText }),
            { status: channelsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const channels = await channelsResponse.json();
        
        return new Response(
          JSON.stringify({ success: true, channels }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in restream-stream function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
