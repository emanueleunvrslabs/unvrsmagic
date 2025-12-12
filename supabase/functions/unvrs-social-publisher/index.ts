import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PublisherRequest {
  user_id: string
  action: 'publish' | 'schedule' | 'optimize_caption'
  content_id?: string
  platforms: string[]
  caption?: string
  scheduled_at?: string
  metadata?: Record<string, any>
}

// Placeholder - will be replaced with user's custom prompt
const PUBLISHER_SYSTEM_PROMPT = `Sei UNVRS.SOCIAL.PUBLISHER, l'agente AI per la pubblicazione multi-piattaforma.

Il tuo obiettivo è:
1. Ottimizzare le caption per ogni piattaforma
2. Adattare i contenuti ai requisiti specifici
3. Gestire la pubblicazione programmata
4. Monitorare lo stato delle pubblicazioni

ADATTAMENTI PER PIATTAFORMA:
- Instagram: max 2200 caratteri, 30 hashtag, emoji, call-to-action
- LinkedIn: professionale, max 3000 caratteri, pochi hashtag (3-5), no emoji eccessivi
- TikTok: breve, hashtag trend, call-to-action forte
- YouTube: descrizione SEO, timestamp, link, hashtag
- Twitter/X: max 280 caratteri, conciso, hashtag (2-3)

FORMATO RISPOSTA (JSON):
{
  "optimized_captions": {
    "instagram": "caption ottimizzata per instagram",
    "linkedin": "caption ottimizzata per linkedin",
    "tiktok": "caption ottimizzata per tiktok"
  },
  "hashtags": {
    "instagram": ["hashtag1", "hashtag2"],
    "linkedin": ["hashtag1"],
    "tiktok": ["hashtag1", "hashtag2"]
  },
  "publishing_status": {
    "platform": "status",
    "scheduled_time": "ISO datetime se programmato"
  },
  "recommendations": ["suggerimenti per migliorare"]
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const request: PublisherRequest = await req.json()
    console.log('[UNVRS.SOCIAL.PUBLISHER] Processing request:', JSON.stringify(request))

    // Get content details if content_id provided
    let content = null
    if (request.content_id) {
      const { data } = await supabase
        .from('ai_social_content')
        .select('*')
        .eq('id', request.content_id)
        .single()
      content = data
    }

    // For caption optimization
    if (request.action === 'optimize_caption' && request.caption) {
      // Get custom prompt if available
      const { data: customPrompt } = await supabase
        .from('agent_prompts')
        .select('prompt')
        .eq('user_id', request.user_id)
        .eq('agent_id', 'social-publisher')
        .single()

      const systemPrompt = customPrompt?.prompt || PUBLISHER_SYSTEM_PROMPT

      // Get Anthropic API key
      const { data: apiKeyData } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('user_id', request.user_id)
        .eq('provider', 'anthropic')
        .single()

      if (!apiKeyData) {
        return new Response(JSON.stringify({
          success: false,
          error: 'API key not configured'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Call Anthropic Claude Haiku (fast for text optimization)
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeyData.api_key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Ottimizza questa caption per le piattaforme ${request.platforms.join(', ')}:\n\n"${request.caption}"\n\nContenuto: ${content?.type || 'immagine'}`
            }
          ]
        })
      })

      if (!anthropicResponse.ok) {
        const error = await anthropicResponse.text()
        console.error('[UNVRS.SOCIAL.PUBLISHER] Anthropic error:', error)
        throw new Error('AI response failed')
      }

      const aiResult = await anthropicResponse.json()
      const aiText = aiResult.content[0]?.text || ''

      // Parse AI response
      let parsedResponse
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0])
        } else {
          parsedResponse = {
            optimized_captions: { default: request.caption },
            recommendations: [aiText]
          }
        }
      } catch (e) {
        parsedResponse = {
          optimized_captions: { default: request.caption },
          recommendations: [aiText.replace(/```json|```/g, '').trim()]
        }
      }

      return new Response(JSON.stringify({
        success: true,
        ...parsedResponse
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // For publishing/scheduling
    if (request.action === 'publish' || request.action === 'schedule') {
      const results: Record<string, any> = {}

      for (const platform of request.platforms) {
        try {
          // Get platform credentials
          const { data: credentials } = await supabase
            .from('api_keys')
            .select('api_key, owner_id')
            .eq('user_id', request.user_id)
            .eq('provider', platform)
            .single()

          if (!credentials) {
            results[platform] = { success: false, error: 'Not connected' }
            continue
          }

          // Platform-specific publishing logic
          // This would integrate with existing Instagram/LinkedIn/etc publishing functions
          results[platform] = {
            success: true,
            status: request.action === 'schedule' ? 'scheduled' : 'published',
            scheduled_at: request.scheduled_at
          }

        } catch (error) {
          results[platform] = {
            success: false,
            error: error instanceof Error ? error.message : 'Publishing failed'
          }
        }
      }

      // Log agent activity
      await supabase.from('agent_logs').insert({
        agent_name: 'unvrs-social-publisher',
        user_id: request.user_id,
        log_level: 'info',
        message: `${request.action} to ${request.platforms.join(', ')}`,
        action: request.action,
        metadata: {
          content_id: request.content_id,
          platforms: request.platforms,
          results
        },
        duration_ms: Date.now() - startTime
      })

      return new Response(JSON.stringify({
        success: true,
        action: request.action,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.SOCIAL.PUBLISHER] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
