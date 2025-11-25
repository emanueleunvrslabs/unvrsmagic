import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )

    const url = new URL(req.url)
    let action = url.searchParams.get('action')

    // Get Instagram app credentials from environment
    const appId = Deno.env.get('INSTAGRAM_APP_ID')
    const appSecret = Deno.env.get('INSTAGRAM_APP_SECRET')

    if (!appId || !appSecret) {
      console.error('Instagram app not configured')
      return new Response(
        JSON.stringify({ error: 'Instagram app not configured. Please add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to secrets.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/instagram-oauth?action=callback`

    // Try to read JSON body (for calls via supabase.functions.invoke)
    let body: any = null
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await req.json()
      } catch (_) {
        // ignore if no JSON body
      }
    }

    if (!action && body && typeof body.action === 'string') {
      action = body.action
    }

    console.log('Instagram OAuth request:', { method: req.method, action })

    // Start OAuth flow
    if (action === 'start') {
      // user_id must come from the client (body or query string)
      let userId = url.searchParams.get('user_id') as string | null
      if (!userId && body && typeof body.user_id === 'string') {
        userId = body.user_id
      }

      console.log('Instagram OAuth start - userId from client:', { hasUserId: !!userId })

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing user_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

       // For Instagram Graph API (publishing capability), use different endpoint and scopes
       const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_read_engagement&response_type=code&state=${userId}`
      console.log('Redirecting to Instagram auth URL')

      return new Response(
        JSON.stringify({ authUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle OAuth callback
    if (action === 'callback') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')

      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: 'Invalid callback parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code,
        }),
      })

      if (!tokenResponse.ok) {
        const text = await tokenResponse.text()
        console.error('Token exchange failed:', text)
        return new Response(
          JSON.stringify({ error: 'Failed to get access token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenData = await tokenResponse.json()
      console.log('Instagram token received for user (state):', state)

      // Save user's Instagram access token
      const { error: saveError } = await supabaseClient
        .from('api_keys')
        .upsert({
          user_id: state,
          provider: 'instagram',
          api_key: tokenData.access_token,
          owner_id: tokenData.user_id?.toString() || '',
        }, { onConflict: 'user_id,provider' })

      if (saveError) {
        console.error('Error saving token:', saveError)
        return new Response(
          JSON.stringify({ error: 'Failed to save token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Redirect back to app with success
      const appUrl = Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || ''
      return Response.redirect(`${appUrl}/ai-social/connection?success=true`, 302)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Instagram OAuth error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
