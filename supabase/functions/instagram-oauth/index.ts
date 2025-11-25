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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // Get Instagram app credentials
    const { data: credentials, error: credError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('provider', 'instagram_app_credentials')
      .single()

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'Instagram app not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const appId = credentials.api_key
    const appSecret = credentials.owner_id
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/instagram-oauth?action=callback`

    // Start OAuth flow
    if (action === 'start') {
      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code&state=${user.id}`
      
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
