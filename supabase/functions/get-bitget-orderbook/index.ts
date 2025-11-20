import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BitgetOrderBookResponse {
  code: string
  msg: string
  data: {
    asks: [string, string][]
    bids: [string, string][]
    ts: string
  }
}

async function getBitgetCredentials(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('exchange_keys')
    .select('api_key, api_secret, passphrase')
    .eq('user_id', userId)
    .eq('exchange', 'bitget')
    .single()

  if (error) throw new Error(`Failed to fetch Bitget credentials: ${error.message}`)
  return data
}

async function generateBitgetSignature(timestamp: string, method: string, requestPath: string, apiSecret: string) {
  const message = timestamp + method + requestPath
  const encoder = new TextEncoder()
  const keyData = encoder.encode(apiSecret)
  const messageData = encoder.encode(message)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
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

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { symbol } = await req.json()
    if (!symbol) {
      throw new Error('Symbol is required')
    }

    console.log(`Fetching order book for ${symbol}`)

    const credentials = await getBitgetCredentials(supabaseClient, user.id)
    const timestamp = Date.now().toString()
    const method = 'GET'
    const requestPath = `/api/v2/spot/market/orderbook?symbol=${symbol}&type=step0&limit=20`
    
    const signature = await generateBitgetSignature(timestamp, method, requestPath, credentials.api_secret)

    const response = await fetch(`https://api.bitget.com${requestPath}`, {
      method: 'GET',
      headers: {
        'ACCESS-KEY': credentials.api_key,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': credentials.passphrase,
        'Content-Type': 'application/json',
        'locale': 'en-US'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Bitget API error:', errorText)
      throw new Error(`Bitget API error: ${response.status} ${errorText}`)
    }

    const data: BitgetOrderBookResponse = await response.json()
    
    if (data.code !== '00000') {
      throw new Error(`Bitget API returned error: ${data.msg}`)
    }

    // Transform the data to match our interface
    const asks = data.data.asks.slice(0, 10).map(([price, amount]) => ({
      price: parseFloat(price),
      amount: parseFloat(amount),
      total: parseFloat(price) * parseFloat(amount)
    }))

    const bids = data.data.bids.slice(0, 10).map(([price, amount]) => ({
      price: parseFloat(price),
      amount: parseFloat(amount),
      total: parseFloat(price) * parseFloat(amount)
    }))

    // Calculate spread
    const highestBid = bids[0]?.price || 0
    const lowestAsk = asks[asks.length - 1]?.price || 0
    const spread = lowestAsk - highestBid
    const spreadPercent = (spread / highestBid) * 100

    const orderBook = {
      symbol: symbol.replace('USDT', ''),
      spread,
      spreadPercent,
      bids,
      asks
    }

    return new Response(JSON.stringify(orderBook), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-bitget-orderbook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
