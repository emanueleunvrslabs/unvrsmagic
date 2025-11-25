import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
