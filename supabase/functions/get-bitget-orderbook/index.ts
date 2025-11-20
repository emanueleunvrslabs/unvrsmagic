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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) {
      throw new Error('Symbol is required')
    }

    console.log(`Fetching public order book for ${symbol}`)

    // Bitget orderbook è pubblico, non richiede autenticazione
    const requestPath = `/api/v2/spot/market/orderbook?symbol=${symbol}&type=step0&limit=20`

    const response = await fetch(`https://api.bitget.com${requestPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'locale': 'en-US'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Bitget API error response:', errorText)

      // Try to parse Bitget error response to handle specific symbol errors
      try {
        const errorJson = JSON.parse(errorText) as { code?: string; msg?: string; data?: unknown }
        console.log('Parsed Bitget error:', { code: errorJson.code, msg: errorJson.msg })
        
        // Check for unavailable symbol error codes
        const isSymbolNotAvailable = 
          errorJson.code === '40309' || 
          errorJson.code === '40034' ||
          (errorJson.msg && (
            errorJson.msg.includes('does not exist') ||
            errorJson.msg.includes('has been removed')
          ))
        
        if (isSymbolNotAvailable) {
          console.log(`Symbol ${symbol} not available on Bitget`)
          return new Response(
            JSON.stringify({
              error: 'Symbol not available',
              code: errorJson.code || '40034',
              message: `${symbol} is not available on Bitget`,
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      } catch (parseError) {
        console.error('Failed to parse Bitget error response:', parseError)
      }

      // If we reach here, it's not a symbol availability error
      throw new Error(`Bitget API error: ${response.status} ${errorText}`)
    }

    const data: BitgetOrderBookResponse = await response.json()
    
    // Handle specific Bitget error codes
    if (data.code === '40309' || data.code === '40034') {
      return new Response(
        JSON.stringify({ 
          error: 'Symbol not available',
          code: data.code,
          message: `${symbol} is not available on Bitget`
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
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
