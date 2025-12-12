import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuoteRequest {
  conversation_id: string
  session_id: string
  user_id: string
  message: string
  brief_id: string
  sender_info: {
    type: 'client' | 'lead'
    client_id?: string
    lead_id?: string
    name?: string
  }
  channel: string
}

// Placeholder - will be replaced with user's custom prompt
const QUOTE_SYSTEM_PROMPT = `Sei UNVRS.QUOTE, l'agente AI di generazione preventivi per UNVRS Labs.

TARIFFE STANDARD UNVRS LABS:
- Sviluppo Web (sito base): €2.000 - €5.000
- Web App (custom): €8.000 - €25.000
- Mobile App (iOS o Android): €15.000 - €40.000
- Mobile App (iOS + Android): €25.000 - €60.000
- Chatbot AI base: €3.000 - €8.000
- Chatbot AI avanzato: €10.000 - €25.000
- Automazione processi: €5.000 - €15.000
- Consulenza (giornata): €800 - €1.200

FATTORI MOLTIPLICATORI:
- Urgenza (<1 mese): +30%
- Integrazioni complesse: +20-40%
- Design custom avanzato: +20%
- Multilingua: +15% per lingua

BRIEF DEL PROGETTO:
{{BRIEF_CONTEXT}}

Il tuo obiettivo è:
1. Analizzare il brief raccolto
2. Generare un preventivo dettagliato con line items
3. Spiegare la stima in modo chiaro
4. Rispondere a domande sul preventivo

FORMATO RISPOSTA (JSON):
{
  "response": "Messaggio di presentazione preventivo",
  "action": "continue" | "quote_ready" | "handoff_human" | "handoff_deck",
  "quote": {
    "line_items": [
      {"description": "descrizione", "quantity": 1, "unit_price": 0, "total": 0}
    ],
    "subtotal": 0,
    "adjustments": [{"reason": "motivo", "amount": 0}],
    "total": 0,
    "timeline_days": 0,
    "assumptions": ["assunzioni chiave"],
    "risks": ["rischi potenziali"]
  }
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

    const request: QuoteRequest = await req.json()
    console.log('[UNVRS.QUOTE] Processing request:', JSON.stringify(request))

    // Get the project brief
    const { data: brief } = await supabase
      .from('unvrs_project_briefs')
      .select('*')
      .eq('id', request.brief_id)
      .single()

    if (!brief) {
      console.error('[UNVRS.QUOTE] Brief not found:', request.brief_id)
      return new Response(JSON.stringify({
        success: false,
        response: 'Non ho trovato il brief del progetto. Vuoi ricominciare la raccolta requisiti?',
        action: 'handoff_intake'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('unvrs_messages')
      .select('direction, content, content_type')
      .eq('conversation_id', request.conversation_id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Build brief context
    const briefContext = buildBriefContext(brief)

    // Get custom prompt if available
    const { data: customPrompt } = await supabase
      .from('agent_prompts')
      .select('prompt')
      .eq('user_id', request.user_id)
      .eq('agent_id', 'quote')
      .single()

    const systemPrompt = (customPrompt?.prompt || QUOTE_SYSTEM_PROMPT)
      .replace('{{BRIEF_CONTEXT}}', briefContext)

    // Build conversation context
    const conversationHistory = (messages || []).map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content || '[media]'
    }))

    conversationHistory.push({
      role: 'user',
      content: request.message
    })

    // Get OpenAI API key - use GPT-5 for complex reasoning
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'openai')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.QUOTE] No OpenAI API key found')
      return new Response(JSON.stringify({
        success: false,
        response: 'Sto preparando il tuo preventivo. Un membro del team te lo invierà a breve!',
        action: 'handoff_human'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Call OpenAI GPT-5 (best for complex calculations)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyData.api_key}`
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(m => ({
            role: m.role,
            content: m.content
          }))
        ]
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('[UNVRS.QUOTE] OpenAI error:', error)
      throw new Error('AI response failed')
    }

    const aiResult = await openaiResponse.json()
    const aiText = aiResult.choices[0]?.message?.content || ''
    
    console.log('[UNVRS.QUOTE] AI response:', aiText)

    // Parse AI response
    let parsedResponse
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = {
          response: aiText,
          action: 'continue'
        }
      }
    } catch (e) {
      console.error('[UNVRS.QUOTE] JSON parse error:', e)
      parsedResponse = {
        response: aiText.replace(/```json|```/g, '').trim(),
        action: 'continue'
      }
    }

    // Save quote if generated
    if (parsedResponse.quote && parsedResponse.action === 'quote_ready') {
      await saveQuote(supabase, request, brief, parsedResponse.quote)
    }

    // Update session
    const { data: session } = await supabase
      .from('unvrs_agent_sessions')
      .select('state')
      .eq('id', request.session_id)
      .single()

    await supabase
      .from('unvrs_agent_sessions')
      .update({
        state: {
          ...((session?.state as object) || {}),
          last_action: parsedResponse.action,
          message_count: ((session?.state as any)?.message_count || 0) + 1,
          has_quote: !!parsedResponse.quote
        },
        last_activity_at: new Date().toISOString()
      })
      .eq('id', request.session_id)

    // Log agent activity
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-quote',
      user_id: request.user_id,
      log_level: 'info',
      message: `Quote generation: ${parsedResponse.action}`,
      action: parsedResponse.action,
      metadata: {
        conversation_id: request.conversation_id,
        session_id: request.session_id,
        brief_id: brief.id,
        has_quote: !!parsedResponse.quote,
        quote_total: parsedResponse.quote?.total
      },
      duration_ms: Date.now() - startTime
    })

    return new Response(JSON.stringify({
      success: true,
      response: parsedResponse.response,
      action: parsedResponse.action,
      quote: parsedResponse.quote
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.QUOTE] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      response: 'Sto finalizzando il preventivo. Ti ricontatteremo presto!',
      action: 'handoff_human',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function buildBriefContext(brief: any): string {
  const reqs = brief.requirements || {}
  
  let context = ''
  if (reqs.project_type) context += `Tipo progetto: ${reqs.project_type}\n`
  if (reqs.description) context += `Descrizione: ${reqs.description}\n`
  if (reqs.target) context += `Target: ${reqs.target}\n`
  if (reqs.budget_range) context += `Budget indicato: ${reqs.budget_range}\n`
  if (reqs.timeline_preference) context += `Timeline: ${reqs.timeline_preference}\n`
  if (reqs.integrations) context += `Integrazioni: ${reqs.integrations}\n`
  if (reqs.design) context += `Design: ${reqs.design}\n`
  
  return context || 'Nessun dettaglio disponibile'
}

async function saveQuote(
  supabase: any,
  request: QuoteRequest,
  brief: any,
  quote: any
) {
  // Generate quote number
  const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`

  const { data, error } = await supabase
    .from('unvrs_project_quotes')
    .insert({
      user_id: request.user_id,
      brief_id: brief.id,
      lead_id: request.sender_info.lead_id,
      client_id: request.sender_info.client_id,
      quote_number: quoteNumber,
      line_items: quote.line_items,
      subtotal: quote.subtotal,
      tax: 0, // Can be calculated later
      total: quote.total,
      currency: 'EUR',
      timeline_days: quote.timeline_days,
      assumptions: quote.assumptions,
      risks: quote.risks,
      status: 'draft',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    })
    .select()
    .single()

  if (error) {
    console.error('[UNVRS.QUOTE] Error saving quote:', error)
  } else {
    console.log('[UNVRS.QUOTE] Saved quote:', data.id)
  }

  return data
}
