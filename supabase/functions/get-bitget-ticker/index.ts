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
    const { symbol } = await req.json()
    
    if (!symbol) {
      throw new Error('Symbol is required')
    }

    // Remove Bitget internal suffixes (_spbl, _sumcbl, etc.)
    const cleanSymbol = symbol.replace(/_[a-z]+$/i, '').toUpperCase()
    
    console.log(`Fetching ticker data for: ${symbol} (cleaned: ${cleanSymbol})`)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get user and check for Webshare proxy
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
              console.log('Using Webshare proxy')
            }
          }
        } catch (error) {
          console.error('Failed to fetch Webshare proxy:', error)
        }
      }
    }

    // Fetch ticker data from Bitget
    const bitgetUrl = `https://api.bitget.com/api/v2/spot/market/ticker?symbol=${cleanSymbol}`
    
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (proxyCredentials) {
      const proxyUrl = `http://${proxyCredentials.username}:${proxyCredentials.password}@${proxyCredentials.address}:${proxyCredentials.port}`
      // @ts-ignore
      fetchOptions.proxy = proxyUrl
    }

    const response = await fetch(bitgetUrl, fetchOptions)

    if (!response.ok) {
      throw new Error(`Bitget API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== '00000') {
      throw new Error(`Bitget API error: ${data.msg}`)
    }

    const ticker = data.data[0]
    
    // Format the ticker data
    const formattedData = {
      symbol: ticker.symbol,
      lastPrice: parseFloat(ticker.lastPr),
      priceChange24h: parseFloat(ticker.change24h),
      priceChangePercent24h: parseFloat(ticker.changePercent24h),
      high24h: parseFloat(ticker.high24h),
      low24h: parseFloat(ticker.low24h),
      volume24h: parseFloat(ticker.baseVolume),
      quoteVolume24h: parseFloat(ticker.quoteVolume),
      openPrice: parseFloat(ticker.openUtc0),
      bidPrice: parseFloat(ticker.bidPr),
      askPrice: parseFloat(ticker.askPr),
    }

    console.log('Ticker data:', formattedData)

    return new Response(
      JSON.stringify({ success: true, data: formattedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error fetching ticker:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
