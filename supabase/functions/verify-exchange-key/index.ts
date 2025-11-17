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


      case "bitget":
        try {
          const timestamp = Date.now().toString()
          const requestPath = '/api/v2/user/verify-info'
          const method = 'GET'
          const preHash = timestamp + method + requestPath
          const signature = createHmac("sha256", apiSecret)
            .update(preHash)
            .digest("base64")

          const response = await fetch(
            `https://api.bitget.com${requestPath}`,
            {
              headers: {
                'ACCESS-KEY': apiKey,
                'ACCESS-SIGN': signature,
                'ACCESS-TIMESTAMP': timestamp,
                'ACCESS-PASSPHRASE': apiSecret,
                'Content-Type': 'application/json',
              },
            }
          )

          console.log(`Bitget response status: ${response.status}`)
          
          const data = await response.json()
          if (response.ok && data.code === '00000') {
            isValid = true
            console.log("Bitget API key is valid")
          } else {
            errorMessage = data.msg || "Invalid Bitget credentials"
            console.error(`Bitget verification failed: ${errorMessage}`)
          }
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "Network error"
          console.error(`Bitget verification error: ${errorMessage}`)
        }
        break

      case "hyperliquid":
        try {
          // Hyperliquid API verification
          const response = await fetch("https://api.hyperliquid.xyz/info", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: "clearinghouseState",
              user: apiKey
            })
          })

          console.log(`Hyperliquid response status: ${response.status}`)
          
          if (response.ok) {
            const data = await response.json()
            if (data) {
              isValid = true
              console.log("Hyperliquid API key is valid")
            } else {
              errorMessage = "Invalid Hyperliquid address"
              console.error(`Hyperliquid verification failed: ${errorMessage}`)
            }
          } else {
            errorMessage = "Invalid Hyperliquid credentials"
            console.error(`Hyperliquid verification failed: ${errorMessage}`)
          }
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "Network error"
          console.error(`Hyperliquid verification error: ${errorMessage}`)
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
