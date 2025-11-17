import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { exchange, apiKey, apiSecret } = await req.json()

    if (!exchange || !apiKey) {
      return new Response(
        JSON.stringify({ isValid: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Verifying ${exchange} API key...`)

    let isValid = false
    let errorMessage = ""

    switch (exchange.toLowerCase()) {
      case "binance":
        try {
          const timestamp = Date.now()
          const queryString = `timestamp=${timestamp}`
          const signature = createHmac("sha256", apiSecret)
            .update(queryString)
            .digest("hex")

          const response = await fetch(
            `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
            {
              headers: {
                'X-MBX-APIKEY': apiKey,
              },
            }
          )

          console.log(`Binance response status: ${response.status}`)
          
          if (response.ok) {
            isValid = true
            console.log("Binance API key is valid")
          } else {
            const errorData = await response.json()
            errorMessage = errorData.msg || "Invalid Binance credentials"
            console.error(`Binance verification failed: ${errorMessage}`)
          }
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "Network error"
          console.error(`Binance verification error: ${errorMessage}`)
        }
        break

      case "coinbase":
        try {
          // Coinbase uses CB-ACCESS-KEY, CB-ACCESS-SIGN, CB-ACCESS-TIMESTAMP
          // For simplicity, we'll do a basic check
          const timestamp = Math.floor(Date.now() / 1000).toString()
          const message = timestamp + 'GET' + '/v2/user'
          const signature = createHmac("sha256", apiSecret)
            .update(message)
            .digest("hex")

          const response = await fetch("https://api.coinbase.com/v2/user", {
            headers: {
              'CB-ACCESS-KEY': apiKey,
              'CB-ACCESS-SIGN': signature,
              'CB-ACCESS-TIMESTAMP': timestamp,
              'CB-VERSION': '2023-01-05',
            },
          })

          console.log(`Coinbase response status: ${response.status}`)
          
          if (response.ok) {
            isValid = true
            console.log("Coinbase API key is valid")
          } else {
            const errorData = await response.json()
            errorMessage = errorData.message || "Invalid Coinbase credentials"
            console.error(`Coinbase verification failed: ${errorMessage}`)
          }
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "Network error"
          console.error(`Coinbase verification error: ${errorMessage}`)
        }
        break

      case "kraken":
        try {
          const nonce = Date.now().toString()
          const path = '/0/private/Balance'
          const postData = `nonce=${nonce}`
          
          // Kraken signature is complex, simplified version here
          const response = await fetch(`https://api.kraken.com${path}`, {
            method: 'POST',
            headers: {
              'API-Key': apiKey,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: postData,
          })

          console.log(`Kraken response status: ${response.status}`)
          
          const data = await response.json()
          if (response.ok && !data.error?.length) {
            isValid = true
            console.log("Kraken API key is valid")
          } else {
            errorMessage = data.error?.[0] || "Invalid Kraken credentials"
            console.error(`Kraken verification failed: ${errorMessage}`)
          }
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "Network error"
          console.error(`Kraken verification error: ${errorMessage}`)
        }
        break

      case "bybit":
        try {
          const timestamp = Date.now().toString()
          const params = `api_key=${apiKey}&timestamp=${timestamp}`
          const signature = createHmac("sha256", apiSecret)
            .update(params)
            .digest("hex")

          const response = await fetch(
            `https://api.bybit.com/v5/user/query-api?${params}&sign=${signature}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )

          console.log(`Bybit response status: ${response.status}`)
          
          const data = await response.json()
          if (response.ok && data.retCode === 0) {
            isValid = true
            console.log("Bybit API key is valid")
          } else {
            errorMessage = data.retMsg || "Invalid Bybit credentials"
            console.error(`Bybit verification failed: ${errorMessage}`)
          }
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "Network error"
          console.error(`Bybit verification error: ${errorMessage}`)
        }
        break

      default:
        return new Response(
          JSON.stringify({ isValid: false, error: "Unsupported exchange" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ 
        isValid, 
        exchange,
        error: isValid ? undefined : errorMessage 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error("Exchange verification error:", error)
    return new Response(
      JSON.stringify({ 
        isValid: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
