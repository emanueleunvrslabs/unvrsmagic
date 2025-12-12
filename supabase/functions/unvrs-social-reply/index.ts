import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReplyRequest {
  user_id: string
  platform: 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'twitter'
  message_type: 'comment' | 'dm' | 'mention'
  content: string
  author_name?: string
  author_id?: string
  post_id?: string
  post_context?: string
  metadata?: Record<string, any>
}

// Placeholder - will be replaced with user's custom prompt
const REPLY_SYSTEM_PROMPT = `Sei UNVRS.SOCIAL.REPLY, l'agente AI per le risposte ai commenti e DM.

CONTESTO:
{{CONTEXT}}

Il tuo obiettivo è:
1. Rispondere a commenti e DM in modo appropriato
2. Mantenere il tono del brand (professionale ma amichevole)
3. Identificare potenziali lead e clienti
4. Escalare richieste complesse agli umani

REGOLE:
- Risposte brevi e pertinenti (max 2-3 frasi)
- Usa emoji moderatamente
- Se è una richiesta commerciale → routing a HLO/SWITCH
- Se è spam/hate → non rispondere
- Se è feedback positivo → ringrazia e coinvolgi
- Se è domanda tecnica → rispondi o escala

TONO PER PIATTAFORMA:
- Instagram: amichevole, emoji, engaging
- LinkedIn: professionale, formale, competente
- TikTok: casual, giovane, divertente
- YouTube: informativo, dettagliato
- Twitter/X: conciso, diretto

FORMATO RISPOSTA (JSON):
{
  "reply": "La tua risposta al commento/DM",
  "action": "reply" | "ignore" | "route_hlo" | "route_switch" | "escalate_human",
  "sentiment": "positive" | "neutral" | "negative",
  "is_potential_lead": true/false,
  "lead_signals": ["segnali che indicano interesse commerciale"],
  "should_follow_up": true/false
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

    const request: ReplyRequest = await req.json()
    console.log('[UNVRS.SOCIAL.REPLY] Processing request:', JSON.stringify(request))

    // Build context
    const context = `
PIATTAFORMA: ${request.platform}
TIPO: ${request.message_type}
AUTORE: ${request.author_name || 'Sconosciuto'}
${request.post_context ? `CONTESTO POST: ${request.post_context}` : ''}

MESSAGGIO:
"${request.content}"
`

    // Get custom prompt if available
    const { data: customPrompt } = await supabase
      .from('agent_prompts')
      .select('prompt')
      .eq('user_id', request.user_id)
      .eq('agent_id', 'social-reply')
      .single()

    const systemPrompt = (customPrompt?.prompt || REPLY_SYSTEM_PROMPT)
      .replace('{{CONTEXT}}', context)

    // Get Anthropic API key - Haiku for fast replies
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'anthropic')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.SOCIAL.REPLY] No Anthropic API key found')
      return new Response(JSON.stringify({
        success: false,
        action: 'escalate_human',
        error: 'API key not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Call Anthropic Claude Haiku (fast for quick replies)
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyData.api_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Genera una risposta appropriata per questo ${request.message_type} su ${request.platform}.`
          }
        ]
      })
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      console.error('[UNVRS.SOCIAL.REPLY] Anthropic error:', error)
      throw new Error('AI response failed')
    }

    const aiResult = await anthropicResponse.json()
    const aiText = aiResult.content[0]?.text || ''
    
    console.log('[UNVRS.SOCIAL.REPLY] AI response:', aiText)

    // Parse AI response
    let parsedResponse
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = {
          reply: aiText,
          action: 'reply',
          sentiment: 'neutral'
        }
      }
    } catch (e) {
      console.error('[UNVRS.SOCIAL.REPLY] JSON parse error:', e)
      parsedResponse = {
        reply: aiText.replace(/```json|```/g, '').trim(),
        action: 'reply',
        sentiment: 'neutral'
      }
    }

    // If potential lead detected, create lead record
    if (parsedResponse.is_potential_lead && request.author_id) {
      await supabase.from('unvrs_leads').insert({
        user_id: request.user_id,
        name: request.author_name,
        source_channel: request.platform,
        metadata: {
          platform_user_id: request.author_id,
          message_type: request.message_type,
          original_message: request.content,
          lead_signals: parsedResponse.lead_signals
        },
        status: 'new',
        notes: `Lead from ${request.platform} ${request.message_type}`
      }).then(({ error }) => {
        if (error) console.error('[UNVRS.SOCIAL.REPLY] Error creating lead:', error)
      })
    }

    // Log agent activity
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-social-reply',
      user_id: request.user_id,
      log_level: 'info',
      message: `${request.message_type} on ${request.platform}: ${parsedResponse.action}`,
      action: parsedResponse.action,
      metadata: {
        platform: request.platform,
        message_type: request.message_type,
        author: request.author_name,
        sentiment: parsedResponse.sentiment,
        is_potential_lead: parsedResponse.is_potential_lead
      },
      duration_ms: Date.now() - startTime
    })

    // If routing to HLO/SWITCH, forward to BRAIN
    if (parsedResponse.action === 'route_hlo' || parsedResponse.action === 'route_switch') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      
      // Forward to BRAIN for proper routing
      await fetch(`${supabaseUrl}/functions/v1/unvrs-brain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          channel: request.platform,
          contact_identifier: request.author_id || request.author_name,
          contact_name: request.author_name,
          content_type: 'text',
          content: request.content,
          metadata: {
            source: 'social_reply',
            message_type: request.message_type,
            post_id: request.post_id
          }
        })
      })
    }

    return new Response(JSON.stringify({
      success: true,
      ...parsedResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.SOCIAL.REPLY] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      action: 'escalate_human',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
