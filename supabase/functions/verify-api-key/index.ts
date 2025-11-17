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
    const { provider, apiKey, keyId } = await req.json();

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
            console.log("OpenAI API key is valid");
          } else {
            const error = await response.json();
            errorMessage = error.error?.message || "Invalid OpenAI API key";
            console.error("OpenAI verification failed:", errorMessage);
          }
        } catch (error) {
          errorMessage = "Failed to verify OpenAI API key";
          console.error("OpenAI verification error:", error);
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
          // Qwen/Alibaba Cloud API verification requires both API key and Key ID
          const { keyId } = await req.json();
          
          if (!keyId) {
            errorMessage = "Key ID is required for Qwen3";
            console.error("Qwen verification failed: missing key_id");
            break;
          }

          const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "X-DashScope-SSE": "disable",
              "X-DashScope-DataInspection": "enable",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "qwen-turbo",
              input: {
                messages: [{ role: "user", content: "test" }]
              },
              parameters: {
                max_tokens: 1,
                api_key: keyId
              }
            }),
          });

          if (response.ok || response.status === 400) {
            isValid = true;
            console.log("Qwen API key is valid");
          } else {
            const error = await response.json();
            errorMessage = error.message || "Invalid Qwen API key";
            console.error("Qwen verification failed:", errorMessage);
          }
        } catch (error) {
          errorMessage = "Failed to verify Qwen API key";
          console.error("Qwen verification error:", error);
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
        isValid, 
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
