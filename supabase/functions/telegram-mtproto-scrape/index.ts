import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// MTProto libraries are not compatible with Supabase Edge Functions
// This is a placeholder that returns an informative error

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[telegram-mtproto-scrape] MTProto not supported in Edge Functions');

  return new Response(
    JSON.stringify({
      success: false,
      error: 'MTProto non supportato',
      message: 'Le librerie MTProto (GramJS, mtcute) richiedono dipendenze native non disponibili in Supabase Edge Functions. Per lo scraping Telegram, considera: 1) Telegram Bot API (limitata ma funziona), 2) Server Node.js esterno con MTProto.'
    }),
    {
      status: 501,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
});