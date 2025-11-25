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
    let userId = url.searchParams.get('user_id')

    // Get Instagram app credentials from environment
    const appId = Deno.env.get('INSTAGRAM_APP_ID')
    const appSecret = Deno.env.get('INSTAGRAM_APP_SECRET')

    console.log('Instagram credentials check:', { hasAppId: !!appId, hasAppSecret: !!appSecret })

    if (!appId || !appSecret) {
      console.error('Instagram app not configured')
      return new Response(
        JSON.stringify({ error: 'Instagram app not configured. Please add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to secrets.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/instagram-oauth?action=callback`

    // Support both query params (GET) and JSON body (POST via supabase.functions.invoke)
    if (!action || !userId) {
      try {
        const body = await req.json()
        action = action || body.action
        userId = userId || body.user_id
        console.log('Parsed body:', { action, userId: userId ? 'present' : 'missing' })
      } catch (error) {
        console.log('No JSON body or parse error:', error)
      }
    }

    // Fallback: try to derive user_id from Authorization header (JWT)
    if (!userId) {
      const authHeader = req.headers.get('Authorization') || ''
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        try {
          const { data, error } = await supabaseClient.auth.getUser(token)
          if (error) {
            console.error('Error getting user from token:', error)
          } else if (data.user) {
            userId = data.user.id
            console.log('Derived user_id from JWT')
          }
        } catch (error) {
          console.error('Exception while getting user from token:', error)
        }
      }
    }

    console.log('OAuth flow:', { action, hasUserId: !!userId })

    // Start OAuth flow
    if (action === 'start') {
      // Derive user_id from current auth context instead of requiring it from client
      try {
        const { data, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !data.user) {
          console.error('Unable to get authenticated user for Instagram OAuth start:', authError)
          return new Response(
            JSON.stringify({ error: 'Unauthorized: missing or invalid user session' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const userIdStr = data.user.id
        console.log('Starting Instagram OAuth for user:', userIdStr)

        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code&state=${userIdStr}`
        
        return new Response(
          JSON.stringify({ authUrl }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Error during Instagram OAuth start:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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
        console.error('Token exchange failed:', await tokenResponse.text())
        return new Response(
          JSON.stringify({ error: 'Failed to get access token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenData = await tokenResponse.json()
      console.log('Instagram token received for user:', state)

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
