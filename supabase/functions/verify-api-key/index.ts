import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, apiKey, ownerId } = await req.json();

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Provider and API key are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying ${provider} API key...`);

    let isValid = false;
    let errorMessage = "";

    // Verify based on provider
    switch (provider) {
      case "openai":
        try {
          const response = await fetch("https://api.openai.com/v1/models", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            isValid = true;
          } else {
            const error = await response.json();
            errorMessage = error.error?.message || "Invalid OpenAI API key";
          }
        } catch (error) {
          errorMessage = "Failed to verify OpenAI API key";
        }
        break;

      case "anthropic":
        try {
          // Anthropic uses a different endpoint structure
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-3-haiku-20240307",
              max_tokens: 1,
              messages: [{ role: "user", content: "test" }]
            }),
          });

          // Even a 400 with proper error structure means the key is valid
          // Invalid keys return 401
          if (response.status === 200 || response.status === 400) {
            isValid = true;
            console.log("Anthropic API key is valid");
          } else if (response.status === 401) {
            const error = await response.json();
            errorMessage = error.error?.message || "Invalid Anthropic API key";
            console.error("Anthropic verification failed:", errorMessage);
          } else {
            errorMessage = "Failed to verify Anthropic API key";
            console.error("Anthropic unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify Anthropic API key";
          console.error("Anthropic verification error:", error);
        }
        break;

      case "qwen":
        try {
          // Qwen Model Studio (International/Singapore) - use OpenAI-compatible endpoint
          const response = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "qwen-turbo",
              messages: [
                { role: "system", content: "Ping for key validation" },
                { role: "user", content: "test" }
              ],
              max_tokens: 1
            }),
          });

          console.log("Qwen response status:", response.status);

          if (response.status === 200 || response.status === 400) {
            isValid = true;
            console.log("Qwen API key is valid");
          } else if (response.status === 401) {
            let errText = await response.text().catch(() => "");
            try {
              const j = JSON.parse(errText || "{}");
              errText = j.error?.message || j.message || errText;
            } catch {}
            errorMessage = errText || "Invalid Qwen API key";
            console.error("Qwen verification failed (401):", errorMessage);
          } else {
            const errBody = await response.text().catch(() => "");
            errorMessage = errBody || `Failed to verify Qwen API key (status: ${response.status})`;
            console.error("Qwen verification unexpected:", errorMessage);
          }
        } catch (error) {
          errorMessage = "Failed to verify Qwen API key";
          console.error("Qwen verification error:", error);
        }
        break;

      case "fal":
        try {
          // Fal AI - test with a simple submit request to flux model
          const response = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
            method: "POST",
            headers: {
              "Authorization": `Key ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: "test"
            }),
          });

          console.log("Fal response status:", response.status);

          // Valid key returns 200, 202 (queue), 400 (bad request but auth ok), or 403 (valid key but no credits/permissions)
          if (response.status === 200 || response.status === 202 || response.status === 400 || response.status === 403) {
            isValid = true;
            console.log("Fal API key is valid");
          } else if (response.status === 401) {
            errorMessage = "Invalid Fal API key";
            console.error("Fal verification failed: 401 Unauthorized");
          } else {
            const errBody = await response.text().catch(() => "");
            console.log("Fal response body:", errBody);
            errorMessage = `Failed to verify Fal API key (status: ${response.status})`;
            console.error("Fal verification unexpected:", errorMessage);
          }
        } catch (error) {
          errorMessage = "Failed to verify Fal API key";
          console.error("Fal verification error:", error);
        }
        break;

      case "firecrawl":
        try {
          // Firecrawl API - verify with scrape endpoint (will fail but auth will be checked)
          const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: "https://example.com"
            }),
          });

          console.log("Firecrawl response status:", response.status);

          // 401/403 = invalid key, 200/400/402 = key is valid
          if (response.status === 401 || response.status === 403) {
            errorMessage = "Invalid Firecrawl API key";
            console.error("Firecrawl verification failed:", response.status);
          } else {
            isValid = true;
            console.log("Firecrawl API key is valid");
          }
        } catch (error) {
          errorMessage = "Failed to verify Firecrawl API key";
          console.error("Firecrawl verification error:", error);
        }
        break;

      case "gamma":
        try {
          // Gamma - test with generations endpoint (will fail but auth will be checked)
          const response = await fetch("https://public-api.gamma.app/v0.2/generations", {
            method: "POST",
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputText: "test"
            }),
          });

          console.log("Gamma response status:", response.status);

          // 401 = invalid key, 400 or other = key is valid but request might be incomplete
          if (response.status === 401) {
            errorMessage = "Invalid Gamma API key";
            console.error("Gamma verification failed: 401");
          } else {
            // Any other status means the key was accepted
            isValid = true;
            console.log("Gamma API key is valid");
          }
        } catch (error) {
          errorMessage = "Failed to verify Gamma API key";
          console.error("Gamma verification error:", error);
        }
        break;

      case "coingecko":
        try {
          // CoinGecko API - verify with a simple ping endpoint
          const response = await fetch(`https://api.coingecko.com/api/v3/ping?x_cg_demo_api_key=${apiKey}`, {
            method: "GET",
            headers: {
              "accept": "application/json",
            },
          });

          console.log("CoinGecko response status:", response.status);

          if (response.status === 200) {
            isValid = true;
            console.log("CoinGecko API key is valid");
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Invalid CoinGecko API key";
            console.error("CoinGecko verification failed:", response.status);
          } else {
            errorMessage = "Failed to verify CoinGecko API key";
            console.error("CoinGecko unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify CoinGecko API key";
          console.error("CoinGecko verification error:", error);
        }
        break;

      case "coinmarketcap":
        try {
          // CoinMarketCap API - verify with cryptocurrency listings endpoint
          const response = await fetch("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=1", {
            method: "GET",
            headers: {
              "X-CMC_PRO_API_KEY": apiKey,
              "Accept": "application/json",
            },
          });

          console.log("CoinMarketCap response status:", response.status);

          if (response.status === 200) {
            isValid = true;
            console.log("CoinMarketCap API key is valid");
          } else if (response.status === 401 || response.status === 403) {
            const error = await response.json();
            errorMessage = error.status?.error_message || "Invalid CoinMarketCap API key";
            console.error("CoinMarketCap verification failed:", errorMessage);
          } else {
            errorMessage = "Failed to verify CoinMarketCap API key";
            console.error("CoinMarketCap unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify CoinMarketCap API key";
          console.error("CoinMarketCap verification error:", error);
        }
        break;

      case "webshare":
        try {
          // Webshare API - verify with proxy list endpoint
          const response = await fetch("https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=1", {
            method: "GET",
            headers: {
              "Authorization": `Token ${apiKey}`,
              "Content-Type": "application/json",
            },
          });

          console.log("Webshare response status:", response.status);

          if (response.status === 200) {
            isValid = true;
            console.log("Webshare API key is valid");
          } else if (response.status === 401 || response.status === 403) {
            const error = await response.json();
            errorMessage = error.detail || "Invalid Webshare API key";
            console.error("Webshare verification failed:", errorMessage);
          } else {
            errorMessage = "Failed to verify Webshare API key";
            console.error("Webshare unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify Webshare API key";
          console.error("Webshare verification error:", error);
        }
        break;

      case "resend":
        try {
          // Resend API - verify with domains endpoint
          const response = await fetch("https://api.resend.com/domains", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });

          console.log("Resend response status:", response.status);

          if (response.status === 200) {
            isValid = true;
            console.log("Resend API key is valid");
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Invalid Resend API key";
            console.error("Resend verification failed:", response.status);
          } else {
            errorMessage = "Failed to verify Resend API key";
            console.error("Resend unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify Resend API key";
          console.error("Resend verification error:", error);
        }
        break;

      case "heygen":
        try {
          // HeyGen API - verify with avatars list endpoint
          const response = await fetch("https://api.heygen.com/v2/avatars", {
            method: "GET",
            headers: {
              "X-Api-Key": apiKey,
              "Accept": "application/json",
            },
          });

          console.log("HeyGen response status:", response.status);

          if (response.status === 200) {
            isValid = true;
            console.log("HeyGen API key is valid");
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Invalid HeyGen API key";
            console.error("HeyGen verification failed:", response.status);
          } else {
            errorMessage = "Failed to verify HeyGen API key";
            console.error("HeyGen unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify HeyGen API key";
          console.error("HeyGen verification error:", error);
        }
        break;

      case "restream":
        try {
          // Restream API - verify with user info endpoint
          // The API key format for Restream is typically: client_id:client_secret or just the access token
          const response = await fetch("https://api.restream.io/v2/user/profile", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });

          console.log("Restream response status:", response.status);

          if (response.status === 200) {
            isValid = true;
            console.log("Restream API key is valid");
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Invalid Restream API key";
            console.error("Restream verification failed:", response.status);
          } else {
            // Try to get error details
            const errBody = await response.text().catch(() => "");
            console.log("Restream error body:", errBody);
            errorMessage = "Failed to verify Restream API key";
            console.error("Restream unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify Restream API key";
          console.error("Restream verification error:", error);
        }
        break;

      case "revolut_business":
        try {
          // Revolut Business API - verify with accounts endpoint
          // Try sandbox first, then production
          const sandboxResponse = await fetch("https://sandbox-b2b.revolut.com/api/1.0/accounts", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });

          console.log("Revolut Business sandbox response status:", sandboxResponse.status);

          if (sandboxResponse.status === 200) {
            isValid = true;
            console.log("Revolut Business API key is valid (sandbox)");
          } else if (sandboxResponse.status === 401 || sandboxResponse.status === 403) {
            // Try production endpoint
            const prodResponse = await fetch("https://b2b.revolut.com/api/1.0/accounts", {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            });

            console.log("Revolut Business production response status:", prodResponse.status);

            if (prodResponse.status === 200) {
              isValid = true;
              console.log("Revolut Business API key is valid (production)");
            } else {
              errorMessage = "Invalid Revolut Business API key";
              console.error("Revolut Business verification failed");
            }
          } else {
            errorMessage = "Failed to verify Revolut Business API key";
            console.error("Revolut Business unexpected status:", sandboxResponse.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify Revolut Business API key";
          console.error("Revolut Business verification error:", error);
        }
        break;

      case "revolut_merchant":
        try {
          // Revolut Merchant API - verify with orders endpoint using the secret key
          // The verification uses the secret key (passed as apiKey parameter)
          // Try sandbox first, then production
          const sandboxResponse = await fetch("https://sandbox-merchant.revolut.com/api/orders", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });

          console.log("Revolut Merchant sandbox response status:", sandboxResponse.status);

          if (sandboxResponse.status === 200 || sandboxResponse.status === 400) {
            isValid = true;
            console.log("Revolut Merchant API key is valid (sandbox)");
          } else if (sandboxResponse.status === 401 || sandboxResponse.status === 403) {
            // Try production endpoint
            const prodResponse = await fetch("https://merchant.revolut.com/api/orders", {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            });

            console.log("Revolut Merchant production response status:", prodResponse.status);

            if (prodResponse.status === 200 || prodResponse.status === 400) {
              isValid = true;
              console.log("Revolut Merchant API key is valid (production)");
            } else {
              errorMessage = "Invalid Revolut Merchant Secret Key";
              console.error("Revolut Merchant verification failed");
            }
          } else {
            errorMessage = "Failed to verify Revolut Merchant API key";
            console.error("Revolut Merchant unexpected status:", sandboxResponse.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify Revolut Merchant API key";
          console.error("Revolut Merchant verification error:", error);
        }
        break;

      case "elevenlabs":
        try {
          // ElevenLabs API - verify with user info endpoint
          const response = await fetch("https://api.elevenlabs.io/v1/user", {
            method: "GET",
            headers: {
              "xi-api-key": apiKey,
              "Accept": "application/json",
            },
          });

          console.log("ElevenLabs response status:", response.status);

          if (response.status === 200) {
            isValid = true;
            console.log("ElevenLabs API key is valid");
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Invalid ElevenLabs API key";
            console.error("ElevenLabs verification failed:", response.status);
          } else {
            errorMessage = "Failed to verify ElevenLabs API key";
            console.error("ElevenLabs unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify ElevenLabs API key";
          console.error("ElevenLabs verification error:", error);
        }
        break;

      case "telegram":
        try {
          // Telegram Bot API - verify with getMe endpoint
          const response = await fetch(`https://api.telegram.org/bot${apiKey}/getMe`, {
            method: "GET",
          });

          console.log("Telegram response status:", response.status);

          const data = await response.json();
          
          if (response.status === 200 && data.ok === true) {
            isValid = true;
            console.log("Telegram Bot Token is valid, bot name:", data.result?.username);
          } else if (response.status === 401 || data.ok === false) {
            errorMessage = data.description || "Invalid Telegram Bot Token";
            console.error("Telegram verification failed:", errorMessage);
          } else {
            errorMessage = "Failed to verify Telegram Bot Token";
            console.error("Telegram unexpected status:", response.status);
          }
        } catch (error) {
          errorMessage = "Failed to verify Telegram Bot Token";
          console.error("Telegram verification error:", error);
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unsupported provider" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ 
        valid: isValid, 
        provider,
        error: isValid ? null : errorMessage 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in verify-api-key function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
