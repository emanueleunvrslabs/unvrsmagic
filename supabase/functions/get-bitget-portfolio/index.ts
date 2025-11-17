import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BitgetSpotAccount {
  coin: string
  available: string
  frozen: string
  locked: string
}

interface BitgetFuturesAccount {
  marginCoin: string
  available: string
  frozen: string
  equity: string
}

interface BitgetPosition {
  symbol: string
  marginCoin: string
  holdSide: string
  total: string
  available: string
  locked: string
  marketPrice: string
  unrealizedPL: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get and validate authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the user from the JWT token
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(bearerToken || '')

    if (userError || !user) {
      console.error('User authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message || 'Auth session missing!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('Authenticated user:', user.id)

    // Get Bitget API credentials from database
    const { data: exchangeKeys, error: keysError } = await supabaseClient
      .from('exchange_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('exchange', 'bitget')
      .single()

    if (keysError || !exchangeKeys) {
      console.error('Exchange keys error:', keysError)
      return new Response(
        JSON.stringify({ error: 'Bitget credentials not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const { api_key, api_secret, passphrase } = exchangeKeys

    // Get Webshare proxy credentials (optional)
    const { data: webshareKey } = await supabaseClient
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'webshare')
      .single()

    let proxyCredentials: { username: string; password: string; address: string; port: number } | null = null

    if (webshareKey?.api_key) {
      console.log('Fetching Webshare proxy credentials...')
      try {
        // Get proxy list from Webshare API
        const proxyListResponse = await fetch('https://proxy.webshare.io/api/v2/proxy/list/', {
          headers: {
            'Authorization': `Token ${webshareKey.api_key}`
          }
        })

        if (proxyListResponse.ok) {
          const proxyData = await proxyListResponse.json()
          if (proxyData.results && proxyData.results.length > 0) {
            // Use the first available proxy
            const proxy = proxyData.results[0]
            proxyCredentials = {
              username: proxy.username,
              password: proxy.password,
              address: proxy.proxy_address,
              port: proxy.port
            }
            console.log('Webshare proxy configured:', { address: proxyCredentials.address, port: proxyCredentials.port })
          }
        } else {
          console.error('Failed to fetch Webshare proxy list:', proxyListResponse.status)
        }
      } catch (error) {
        console.error('Error fetching Webshare proxy credentials:', error)
      }
    }

    // Helper function to sign Bitget requests
    const signRequest = async (timestamp: string, method: string, requestPath: string, body = '') => {
      const prehash = timestamp + method + requestPath + body
      const encoder = new TextEncoder()
      const keyData = encoder.encode(api_secret)
      const messageData = encoder.encode(prehash)
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      
      const signature = await crypto.subtle.sign('HMAC', key, messageData)
      const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      
      return base64Signature
    }

    // Helper function to make Bitget API calls
    const callBitgetAPI = async (endpoint: string) => {
      const timestamp = Date.now().toString()
      const method = 'GET'
      const requestPath = endpoint
      
      const signature = await signRequest(timestamp, method, requestPath)
      
      const headers: Record<string, string> = {
        'ACCESS-KEY': api_key,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': passphrase,
        'Content-Type': 'application/json',
      }

      let fetchOptions: RequestInit = {
        method: 'GET',
        headers: headers,
      }

      let apiUrl = `https://api.bitget.com${endpoint}`

      // Configure proxy if available
      if (proxyCredentials) {
        const proxyAuth = btoa(`${proxyCredentials.username}:${proxyCredentials.password}`)
        const proxyUrl = `http://${proxyCredentials.address}:${proxyCredentials.port}`
        
        // Use Deno's native proxy support
        fetchOptions = {
          ...fetchOptions,
          // @ts-ignore - Deno supports proxy in fetch
          proxy: {
            url: proxyUrl,
            basicAuth: {
              username: proxyCredentials.username,
              password: proxyCredentials.password
            }
          }
        }
        
        console.log(`Calling Bitget API: ${endpoint} (via Webshare proxy)`)
      } else {
        console.log(`Calling Bitget API: ${endpoint} (direct connection)`)
      }

      const response = await fetch(apiUrl, fetchOptions)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Bitget API error for ${endpoint}:`, response.status, errorText)
        throw new Error(`Bitget API error: ${response.status}`)
      }

      return await response.json()
    }

    console.log('Fetching Bitget portfolio data...')

    // Fetch spot account balance
    const spotData = await callBitgetAPI('/api/v2/spot/account/assets')
    console.log('Spot data:', JSON.stringify(spotData))

    // Fetch futures account balance (USDT-M)
    const futuresData = await callBitgetAPI('/api/v2/mix/account/accounts?productType=USDT-FUTURES')
    console.log('Futures data:', JSON.stringify(futuresData))

    // Fetch open positions
    const positionsData = await callBitgetAPI('/api/v2/mix/position/all-position?productType=USDT-FUTURES')
    console.log('Positions data:', JSON.stringify(positionsData))

    // Calculate total portfolio value
    let totalSpot = 0
    let totalFutures = 0
    let totalPositions = 0

    // Calculate spot balance
    if (spotData.data && Array.isArray(spotData.data)) {
      spotData.data.forEach((coin: BitgetSpotAccount) => {
        const available = parseFloat(coin.available || '0')
        const frozen = parseFloat(coin.frozen || '0')
        const locked = parseFloat(coin.locked || '0')
        totalSpot += available + frozen + locked
      })
    }

    // Calculate futures balance
    if (futuresData.data && Array.isArray(futuresData.data)) {
      futuresData.data.forEach((account: BitgetFuturesAccount) => {
        const equity = parseFloat(account.equity || '0')
        totalFutures += equity
      })
    }

    // Calculate positions value (unrealized P&L is already included in equity)
    if (positionsData.data && Array.isArray(positionsData.data)) {
      positionsData.data.forEach((position: BitgetPosition) => {
        const unrealizedPL = parseFloat(position.unrealizedPL || '0')
        totalPositions += unrealizedPL
      })
    }

    const totalValue = totalSpot + totalFutures

    console.log('Portfolio calculation:', {
      totalSpot,
      totalFutures,
      totalPositions,
      totalValue,
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalValue,
          spot: totalSpot,
          futures: totalFutures,
          unrealizedPnL: totalPositions,
          breakdown: {
            spotAccounts: spotData.data || [],
            futuresAccounts: futuresData.data || [],
            positions: positionsData.data || [],
          },
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching Bitget portfolio:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
