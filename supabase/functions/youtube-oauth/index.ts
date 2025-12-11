import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const youtubeClientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const youtubeClientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');

    if (!youtubeClientId || !youtubeClientSecret) {
      console.error('Missing YouTube OAuth credentials');
      return new Response(
        JSON.stringify({ error: 'YouTube OAuth credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    
    // Check if this is a callback from Google OAuth
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error from Google:', error);
      const stateData = state ? JSON.parse(decodeURIComponent(state)) : {};
      const redirectUrl = `${stateData.origin || 'https://preview--amvbkkbqkzklrcynpwwm.lovable.app'}/ai-social/connection?error=${encodeURIComponent(error)}`;
      return Response.redirect(redirectUrl, 302);
    }

    if (code && state) {
      // This is the OAuth callback - exchange code for tokens
      console.log('Received OAuth callback with code');
      
      let stateData;
      try {
        stateData = JSON.parse(decodeURIComponent(state));
      } catch (e) {
        console.error('Failed to parse state:', e);
        return new Response(
          JSON.stringify({ error: 'Invalid state parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { user_id, origin } = stateData;
      const redirectUri = `${supabaseUrl}/functions/v1/youtube-oauth`;

      // Exchange authorization code for tokens
      console.log('Exchanging code for tokens...');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: youtubeClientId,
          client_secret: youtubeClientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Token response status:', tokenResponse.status);

      if (!tokenResponse.ok || tokenData.error) {
        console.error('Token exchange failed:', tokenData);
        const errorMsg = tokenData.error_description || tokenData.error || 'Token exchange failed';
        const redirectUrl = `${origin || 'https://preview--amvbkkbqkzklrcynpwwm.lovable.app'}/ai-social/connection?error=${encodeURIComponent(errorMsg)}`;
        return Response.redirect(redirectUrl, 302);
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      console.log('Got access token, fetching channel info...');

      // Get YouTube channel info
      const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const channelData = await channelResponse.json();
      console.log('Channel response status:', channelResponse.status);

      if (!channelResponse.ok || !channelData.items || channelData.items.length === 0) {
        console.error('Failed to get channel info:', channelData);
        const errorMsg = 'No YouTube channel found for this account';
        const redirectUrl = `${origin || 'https://preview--amvbkkbqkzklrcynpwwm.lovable.app'}/ai-social/connection?error=${encodeURIComponent(errorMsg)}`;
        return Response.redirect(redirectUrl, 302);
      }

      const channel = channelData.items[0];
      const channelId = channel.id;
      const channelTitle = channel.snippet.title;
      console.log('Found channel:', channelTitle, channelId);

      // Store credentials in api_keys table
      // Format: access_token|refresh_token|expires_at
      const expiresAt = Date.now() + (expires_in * 1000);
      const apiKeyValue = JSON.stringify({
        access_token,
        refresh_token,
        expires_at: expiresAt,
        channel_id: channelId,
        channel_title: channelTitle,
      });

      // Check if user already has YouTube connection
      const { data: existingKey } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', user_id)
        .eq('provider', 'youtube')
        .single();

      if (existingKey) {
        // Update existing
        const { error: updateError } = await supabase
          .from('api_keys')
          .update({
            api_key: apiKeyValue,
            owner_id: channelId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingKey.id);

        if (updateError) {
          console.error('Failed to update YouTube credentials:', updateError);
          const redirectUrl = `${origin || 'https://preview--amvbkkbqkzklrcynpwwm.lovable.app'}/ai-social/connection?error=${encodeURIComponent('Failed to save credentials')}`;
          return Response.redirect(redirectUrl, 302);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('api_keys')
          .insert({
            user_id,
            provider: 'youtube',
            api_key: apiKeyValue,
            owner_id: channelId,
          });

        if (insertError) {
          console.error('Failed to save YouTube credentials:', insertError);
          const redirectUrl = `${origin || 'https://preview--amvbkkbqkzklrcynpwwm.lovable.app'}/ai-social/connection?error=${encodeURIComponent('Failed to save credentials')}`;
          return Response.redirect(redirectUrl, 302);
        }
      }

      console.log('YouTube credentials saved successfully');
      const successUrl = `${origin || 'https://preview--amvbkkbqkzklrcynpwwm.lovable.app'}/ai-social/connection?youtube_success=true&channel=${encodeURIComponent(channelTitle)}`;
      return Response.redirect(successUrl, 302);
    }

    // This is the initial OAuth request - generate auth URL
    const body = await req.json();
    const { action, user_id, origin: requestOrigin } = body;

    if (action === 'start') {
      console.log('Starting YouTube OAuth flow for user:', user_id);
      
      const redirectUri = `${supabaseUrl}/functions/v1/youtube-oauth`;
      const state = encodeURIComponent(JSON.stringify({ user_id, origin: requestOrigin }));
      
      // YouTube/Google OAuth scopes for live streaming
      const scopes = [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtube.readonly',
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${youtubeClientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${state}`;

      console.log('Generated auth URL');
      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('YouTube OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
