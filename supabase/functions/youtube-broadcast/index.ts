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

    const { action, title, description, sessionId } = await req.json();

    // Get user's YouTube credentials
    const { data: youtubeCredentials, error: credError } = await supabase
      .from('api_keys')
      .select('api_key, owner_id')
      .eq('user_id', user.id)
      .eq('provider', 'youtube')
      .single();

    if (credError || !youtubeCredentials) {
      console.error('YouTube credentials not found:', credError);
      return new Response(
        JSON.stringify({ error: 'YouTube not connected. Please connect your YouTube account first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = youtubeCredentials.api_key;

    if (action === 'create') {
      // Step 1: Create a live broadcast
      console.log('Creating YouTube live broadcast...');
      const broadcastResponse = await fetch('https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: title || 'AI Avatar Live Stream',
            description: description || 'Live stream powered by AI Avatar',
            scheduledStartTime: new Date().toISOString(),
          },
          status: {
            privacyStatus: 'public', // or 'unlisted' or 'private'
            selfDeclaredMadeForKids: false,
          },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true,
            latencyPreference: 'ultraLow',
          },
        }),
      });

      if (!broadcastResponse.ok) {
        const errorText = await broadcastResponse.text();
        console.error('Failed to create broadcast:', broadcastResponse.status, errorText);
        
        // Check if token expired
        if (broadcastResponse.status === 401) {
          return new Response(
            JSON.stringify({ error: 'YouTube token expired. Please reconnect your YouTube account.' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to create YouTube broadcast', details: errorText }),
          { status: broadcastResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const broadcast = await broadcastResponse.json();
      console.log('Broadcast created:', broadcast.id);

      // Step 2: Create a live stream (to get RTMP URL)
      console.log('Creating YouTube live stream...');
      const streamResponse = await fetch('https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: `Stream for ${title || 'AI Avatar'}`,
          },
          cdn: {
            frameRate: '30fps',
            ingestionType: 'rtmp',
            resolution: '1080p',
          },
        }),
      });

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        console.error('Failed to create stream:', streamResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to create YouTube stream', details: errorText }),
          { status: streamResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stream = await streamResponse.json();
      console.log('Stream created:', stream.id);

      // Step 3: Bind the broadcast to the stream
      console.log('Binding broadcast to stream...');
      const bindResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcast.id}&part=id,snippet,status&streamId=${stream.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!bindResponse.ok) {
        const errorText = await bindResponse.text();
        console.error('Failed to bind broadcast:', bindResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to bind broadcast to stream', details: errorText }),
          { status: bindResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Broadcast bound to stream successfully');

      // Extract RTMP URL and stream key
      const rtmpUrl = stream.cdn?.ingestionInfo?.ingestionAddress;
      const streamKey = stream.cdn?.ingestionInfo?.streamName;

      // Update session with YouTube broadcast info if sessionId provided
      if (sessionId) {
        const { error: updateError } = await supabase
          .from('ai_live_sessions')
          .update({
            metadata: {
              youtube_broadcast_id: broadcast.id,
              youtube_stream_id: stream.id,
              youtube_rtmp_url: rtmpUrl,
              youtube_stream_key: streamKey,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Failed to update session:', updateError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          broadcastId: broadcast.id,
          streamId: stream.id,
          rtmpUrl,
          streamKey,
          watchUrl: `https://www.youtube.com/watch?v=${broadcast.id}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'transition') {
      // Transition broadcast status (e.g., to 'live' or 'complete')
      const { broadcastId, status } = await req.json();
      
      console.log(`Transitioning broadcast ${broadcastId} to ${status}...`);
      const transitionResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?id=${broadcastId}&broadcastStatus=${status}&part=id,status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!transitionResponse.ok) {
        const errorText = await transitionResponse.text();
        console.error('Failed to transition broadcast:', transitionResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to transition broadcast', details: errorText }),
          { status: transitionResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await transitionResponse.json();
      return new Response(
        JSON.stringify({ success: true, status: result.status?.lifeCycleStatus }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'get-chat') {
      // Get live chat messages
      const { liveChatId, pageToken } = await req.json();
      
      let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const chatResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error('Failed to get chat:', chatResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to get chat messages', details: errorText }),
          { status: chatResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const chatData = await chatResponse.json();
      return new Response(
        JSON.stringify(chatData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'get-broadcast-details') {
      // Get broadcast details including liveChatId
      const { broadcastId } = await req.json();
      
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts?id=${broadcastId}&part=snippet,status,contentDetails`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!detailsResponse.ok) {
        const errorText = await detailsResponse.text();
        console.error('Failed to get broadcast details:', detailsResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to get broadcast details', details: errorText }),
          { status: detailsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const detailsData = await detailsResponse.json();
      const broadcastDetails = detailsData.items?.[0];
      
      return new Response(
        JSON.stringify({
          liveChatId: broadcastDetails?.snippet?.liveChatId,
          status: broadcastDetails?.status?.lifeCycleStatus,
          watchUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in youtube-broadcast function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
