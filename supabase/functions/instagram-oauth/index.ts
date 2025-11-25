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
    // Use service role to bypass RLS for saving tokens
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

      // Get the origin from the request to redirect back to the correct app URL
      const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || ''
      
      // Encode both userId and origin in state (separated by |)
      const stateData = `${userId}|${origin}`

       // For Instagram Graph API (publishing capability), use Facebook Login endpoint
       const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code&state=${encodeURIComponent(stateData)}`
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

      // Decode state to get userId and origin
      const [userId, appOrigin] = decodeURIComponent(state).split('|')

      // Exchange code for Facebook access token
      const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`)

      if (!tokenResponse.ok) {
        const text = await tokenResponse.text()
        console.error('Token exchange failed:', text)
        return new Response(
          JSON.stringify({ error: 'Failed to get access token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenData = await tokenResponse.json()
      console.log('Facebook token received for user (state):', userId)

      // Get user's Facebook pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${tokenData.access_token}`)
      
      if (!pagesResponse.ok) {
        console.error('Failed to get Facebook pages')
        return new Response(
          JSON.stringify({ error: 'Failed to get Facebook pages' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const pagesData = await pagesResponse.json()
      
      // Get Instagram Business Account from the first page
      if (pagesData.data && pagesData.data.length > 0) {
        const pageId = pagesData.data[0].id
        const pageAccessToken = pagesData.data[0].access_token
        
        const igAccountResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`)
        
        if (!igAccountResponse.ok) {
          console.error('Failed to get Instagram account')
          return new Response(
            JSON.stringify({ error: 'No Instagram Business Account linked' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const igAccountData = await igAccountResponse.json()
        const instagramAccountId = igAccountData.instagram_business_account?.id

        if (!instagramAccountId) {
          return new Response(
            JSON.stringify({ error: 'No Instagram Business Account found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Save user's Instagram access token and account ID
        const { error: saveError } = await supabaseClient
          .from('api_keys')
          .upsert({
            user_id: userId,
            provider: 'instagram',
            api_key: pageAccessToken,
            owner_id: instagramAccountId,
          }, { onConflict: 'user_id,provider' })

        if (saveError) {
          console.error('Error saving token:', saveError)
          return new Response(
            JSON.stringify({ error: 'Failed to save token' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Instagram Business Account connected:', instagramAccountId)
      } else {
        return new Response(
          JSON.stringify({ error: 'No Facebook pages found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Redirect back to app with success
      const redirectUrl = appOrigin || 'https://amvbkkbqkzklrcynpwwm.lovableproject.com'
      return Response.redirect(`${redirectUrl}/ai-social/connection?success=true`, 302)
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
