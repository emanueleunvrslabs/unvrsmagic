import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, params } = await req.json()
    console.log('Revolut Business API request:', { action, userId: user.id })

    // Handle Merchant-only actions first (don't require Business API credentials)
    if (action === 'getMerchantOrders') {
      return await handleMerchantOrders(supabase, user.id, params)
    }

    // Get Revolut Business credentials for other actions
    const { data: configData, error: configError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'revolut_business')
      .single()

    if (configError || !configData) {
      return new Response(JSON.stringify({ error: 'Revolut Business not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const config = JSON.parse(configData.api_key)
    
    if (!config.access_token) {
      return new Response(JSON.stringify({ error: 'Not authorized. Please complete OAuth flow.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if token needs refresh (if we have token expiry info)
    let accessToken = config.access_token
    
    // Make API request to Revolut Business
    const apiBase = 'https://b2b.revolut.com/api/1.0'
    let endpoint = ''
    let method = 'GET'
    let body = null

    switch (action) {
      case 'getAccounts':
        endpoint = '/accounts'
        break
      
      case 'getAccount':
        endpoint = `/accounts/${params.accountId}`
        break
      
      case 'getAccountDetails':
        endpoint = `/accounts/${params.accountId}/bank-details`
        break
      
      case 'getTransactions':
        const queryParams = new URLSearchParams()
        if (params.from) queryParams.append('from', params.from)
        if (params.to) queryParams.append('to', params.to)
        if (params.count) queryParams.append('count', params.count.toString())
        if (params.type) queryParams.append('type', params.type)
        endpoint = `/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`
        break
      
      case 'getTransaction':
        endpoint = `/transaction/${params.transactionId}`
        break
      
      case 'getCounterparties':
        endpoint = '/counterparties'
        break
      
      case 'getExchangeRate':
        endpoint = `/rate?from=${params.from}&to=${params.to}&amount=${params.amount || 1}`
        break
      
      case 'createTransfer':
        // Transfer between own accounts
        endpoint = '/transfer'
        method = 'POST'
        body = {
          request_id: params.request_id || crypto.randomUUID(),
          source_account_id: params.source_account_id,
          target_account_id: params.target_account_id,
          amount: params.amount,
          currency: params.currency,
          reference: params.reference || 'Internal transfer',
        }
        break
      
      case 'createPayment':
        // Payment to counterparty
        endpoint = '/pay'
        method = 'POST'
        body = {
          request_id: params.request_id || crypto.randomUUID(),
          account_id: params.account_id,
          receiver: params.receiver,
          amount: params.amount,
          currency: params.currency,
          reference: params.reference || 'Payment',
        }
        break
      
      case 'createCounterparty':
        endpoint = '/counterparty'
        method = 'POST'
        body = params.counterparty
        break
      
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    console.log('Calling Revolut API:', { endpoint, method })

    const response = await fetch(`${apiBase}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Revolut API error:', responseData)
      
      // Check if token expired
      if (response.status === 401) {
        // Try to refresh token
        const refreshResult = await refreshAccessToken(supabase, user.id, config)
        if (refreshResult.success) {
          // Retry the request with new token
          const retryResponse = await fetch(`${apiBase}${endpoint}`, {
            method,
            headers: {
              'Authorization': `Bearer ${refreshResult.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
          })
          
          const retryData = await retryResponse.json()
          if (retryResponse.ok) {
            return new Response(JSON.stringify(retryData), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }
        
        return new Response(JSON.stringify({ error: 'Token expired. Please reconnect Revolut.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      return new Response(JSON.stringify({ error: responseData.message || 'Revolut API error' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    console.error('Error in revolut-business-api:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleMerchantOrders(supabase: any, userId: string, params: any): Promise<Response> {
  const OWNER_USER_ID = "9d8f65ef-58ef-47db-be8f-926f26411b39";
  
  // Get Merchant secret key
  const { data: merchantKeyData, error: keyError } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', OWNER_USER_ID)
    .eq('provider', 'revolut_merchant_secret')
    .single();

  if (keyError || !merchantKeyData) {
    return new Response(JSON.stringify({ error: 'Merchant credentials not configured' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const merchantSecretKey = merchantKeyData.api_key;
  const isSandbox = merchantSecretKey.startsWith('sandbox_');
  const apiBase = isSandbox 
    ? 'https://sandbox-merchant.revolut.com/api/orders'
    : 'https://merchant.revolut.com/api/orders';

  try {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from_created_date', params.from);
    if (params?.to) queryParams.append('to_created_date', params.to);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${apiBase}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${merchantSecretKey}`,
        'Accept': 'application/json',
        'Revolut-Api-Version': '2024-09-01',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Merchant API error:', data);
      return new Response(JSON.stringify({ error: data.message || 'Merchant API error' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Merchant orders error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function refreshAccessToken(supabase: any, userId: string, config: any): Promise<{ success: boolean; accessToken?: string }> {
  try {
    if (!config.refresh_token) {
      return { success: false }
    }

    // Get private key for JWT
    const { data: privateKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('provider', 'revolut_business_cert')
      .single()

    if (!privateKeyData) {
      return { success: false }
    }

    const jwt = await createClientAssertionJWT(config.client_id, privateKeyData.api_key)

    const tokenResponse = await fetch('https://b2b.revolut.com/api/1.0/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: config.refresh_token,
        client_id: config.client_id,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: jwt,
      }).toString(),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token refresh failed:', tokenData)
      return { success: false }
    }

    // Update stored tokens
    const updatedConfig = {
      ...config,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || config.refresh_token,
      token_refreshed_at: new Date().toISOString(),
    }

    await supabase
      .from('api_keys')
      .update({ api_key: JSON.stringify(updatedConfig) })
      .eq('user_id', userId)
      .eq('provider', 'revolut_business')

    return { success: true, accessToken: tokenData.access_token }
  } catch (error) {
    console.error('Error refreshing token:', error)
    return { success: false }
  }
}

async function createClientAssertionJWT(clientId: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 300

  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: 'amvbkkbqkzklrcynpwwm.supabase.co',
    sub: clientId,
    aud: 'https://revolut.com',
    iat: now,
    exp: exp,
  }

  const encodedHeader = base64UrlEncodeString(JSON.stringify(header))
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const privateKey = await importPrivateKey(privateKeyPem)
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    new TextEncoder().encode(signingInput)
  )

  return `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(signature))}`
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

function base64UrlEncodeString(str: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(str))
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
