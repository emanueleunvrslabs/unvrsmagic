import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BitgetSymbol {
  symbol: string
  baseCoin: string
  quoteCoin: string
  minTradeAmount: string
  maxTradeAmount: string
  takerFeeRate: string
  makerFeeRate: string
  priceScale: string
  quantityScale: string
  status: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get Webshare proxy credentials (optional)
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    let proxyCredentials: { username: string; password: string; address: string; port: number } | null = null

    if (user) {
      const { data: webshareKey } = await supabaseClient
        .from('api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('provider', 'webshare')
        .single()

      if (webshareKey?.api_key) {
        try {
          const proxyListResponse = await fetch('https://proxy.webshare.io/api/v2/proxy/list/', {
            headers: {
              'Authorization': `Token ${webshareKey.api_key}`
            }
          })

          if (proxyListResponse.ok) {
            const proxyData = await proxyListResponse.json()
            if (proxyData.results && proxyData.results.length > 0) {
              const proxy = proxyData.results[0]
              proxyCredentials = {
                username: proxy.username,
                password: proxy.password,
                address: proxy.proxy_address,
                port: proxy.port
              }
            }
          }
        } catch (error) {
          console.error('Error fetching proxy credentials:', error)
        }
      }
    }

    // Fetch symbols from Bitget API
    const bitgetUrl = 'https://api.bitget.com/api/v2/spot/public/symbols'
    
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    // Add proxy configuration if available
    if (proxyCredentials) {
      const proxyUrl = `http://${proxyCredentials.username}:${proxyCredentials.password}@${proxyCredentials.address}:${proxyCredentials.port}`
      // @ts-ignore - Deno supports proxy
      fetchOptions.proxy = proxyUrl
    }

    const response = await fetch(bitgetUrl, fetchOptions)

    if (!response.ok) {
      throw new Error(`Bitget API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.code !== '00000') {
      throw new Error(`Bitget API error: ${data.msg}`)
    }

    // Filter and format symbols
    const symbols = data.data
      .filter((symbol: BitgetSymbol) => symbol.status === 'online')
      .map((symbol: BitgetSymbol) => ({
        symbol: symbol.symbol,
        name: `${symbol.baseCoin}/${symbol.quoteCoin}`,
        baseCoin: symbol.baseCoin,
        quoteCoin: symbol.quoteCoin,
      }))
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol))

    return new Response(
      JSON.stringify({ success: true, data: symbols }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error fetching Bitget symbols:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
