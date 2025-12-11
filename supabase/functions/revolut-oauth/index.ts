import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // This is the user_id
    const error = url.searchParams.get('error')

    console.log('Revolut OAuth callback received:', { code: !!code, state, error })

    if (error) {
      console.error('Revolut OAuth error:', error)
      return Response.redirect(`${getAppUrl()}/settings?tab=security&error=${encodeURIComponent(error)}`)
    }

    if (!code || !state) {
      console.error('Missing code or state')
      return Response.redirect(`${getAppUrl()}/settings?tab=security&error=missing_params`)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the stored certificate data for this user
    const { data: certData, error: certError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', state)
      .eq('provider', 'revolut_business')
      .single()

    if (certError || !certData) {
      console.error('Error fetching certificate data:', certError)
      return Response.redirect(`${getAppUrl()}/settings?tab=security&error=cert_not_found`)
    }

    // Get the private key
    const { data: privateKeyData, error: pkError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', state)
      .eq('provider', 'revolut_business_cert')
      .single()

    if (pkError || !privateKeyData) {
      console.error('Error fetching private key:', pkError)
      return Response.redirect(`${getAppUrl()}/settings?tab=security&error=private_key_not_found`)
    }

    const config = JSON.parse(certData.api_key)
    const clientId = config.client_id
    const redirectUri = config.redirect_uri
    const privateKey = privateKeyData.api_key

    console.log('Exchanging authorization code for tokens...')

    // Create JWT for client assertion
    const jwt = await createClientAssertionJWT(clientId, privateKey)

    // Exchange code for tokens
    const tokenResponse = await fetch('https://b2b.revolut.com/api/1.0/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        redirect_uri: redirectUri,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: jwt,
      }).toString(),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return Response.redirect(`${getAppUrl()}/settings?tab=security&error=token_exchange_failed`)
    }

    console.log('Token exchange successful')

    // Update the stored config with access token
    const updatedConfig = {
      ...config,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      connected_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ api_key: JSON.stringify(updatedConfig) })
      .eq('user_id', state)
      .eq('provider', 'revolut_business')

    if (updateError) {
      console.error('Error saving tokens:', updateError)
      return Response.redirect(`${getAppUrl()}/settings?tab=security&error=save_failed`)
    }

    console.log('Revolut Business OAuth completed successfully')
    return Response.redirect(`${getAppUrl()}/settings?tab=security&success=revolut_connected`)

  } catch (error) {
    console.error('Revolut OAuth error:', error)
    return Response.redirect(`${getAppUrl()}/settings?tab=security&error=unknown_error`)
  }
})

function getAppUrl(): string {
  // Return the app URL based on environment
  return Deno.env.get('APP_URL') || 'https://7ecba86f-fec9-4726-9ec4-0c8ba9b77b43.lovableproject.com'
}

async function createClientAssertionJWT(clientId: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 300 // 5 minutes

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const payload = {
    iss: clientId,
    sub: clientId,
    aud: 'https://b2b.revolut.com/api/1.0/auth/token',
    iat: now,
    exp: exp,
  }

  const encodedHeader = base64UrlEncodeString(JSON.stringify(header))
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  // Import the private key
  const privateKey = await importPrivateKey(privateKeyPem)
  
  // Sign the JWT
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    new TextEncoder().encode(signingInput)
  )

  const encodedSignature = base64UrlEncodeBytes(new Uint8Array(signature))

  return `${signingInput}.${encodedSignature}`
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Remove PEM headers and decode
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )
}

function base64UrlEncodeString(str: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  return base64UrlEncodeBytes(data)
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
