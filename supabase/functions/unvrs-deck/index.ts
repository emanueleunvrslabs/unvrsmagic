import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeckRequest {
  conversation_id: string
  session_id: string
  user_id: string
  message: string
  quote_id?: string
  brief_id?: string
  sender_info: {
    type: 'client' | 'lead'
    client_id?: string
    lead_id?: string
    name?: string
  }
  channel: string
}

// Placeholder - will be replaced with user's custom prompt
const DECK_SYSTEM_PROMPT = `Sei UNVRS.DECK, l'agente AI di generazione presentazioni per UNVRS Labs.

Il tuo obiettivo è:
1. Creare presentazioni professionali per proposte commerciali
2. Generare slide deck per preventivi
3. Personalizzare il contenuto in base al cliente/lead

STRUTTURA PRESENTAZIONE STANDARD:
1. Cover slide con logo e titolo progetto
2. Chi siamo (breve intro UNVRS Labs)
3. Comprensione del progetto (riepilogo brief)
4. Soluzione proposta
5. Tecnologie utilizzate
6. Timeline e milestones
7. Investimento (preventivo)
8. Prossimi passi
9. Contatti

BRIEF/QUOTE CONTEXT:
{{CONTEXT}}

FORMATO RISPOSTA (JSON):
{
  "response": "Messaggio all'utente",
  "action": "continue" | "deck_ready" | "generating" | "handoff_human",
  "deck_content": {
    "title": "Titolo presentazione",
    "slides": [
      {
        "title": "Titolo slide",
        "content": "Contenuto in markdown",
        "notes": "Note per il presenter"
      }
    ]
  },
  "gamma_prompt": "Prompt per Gamma AI (se generazione richiesta)"
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

    const request: DeckRequest = await req.json()
    console.log('[UNVRS.DECK] Processing request:', JSON.stringify(request))

    // Get brief and/or quote for context
    let context = ''
    
    if (request.quote_id) {
      const { data: quote } = await supabase
        .from('unvrs_project_quotes')
        .select('*, unvrs_project_briefs(*)')
        .eq('id', request.quote_id)
        .single()
      
      if (quote) {
        context = buildQuoteContext(quote)
      }
    } else if (request.brief_id) {
      const { data: brief } = await supabase
        .from('unvrs_project_briefs')
        .select('*')
        .eq('id', request.brief_id)
        .single()
      
      if (brief) {
        context = buildBriefContext(brief)
      }
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('unvrs_messages')
      .select('direction, content, content_type')
      .eq('conversation_id', request.conversation_id)
      .order('created_at', { ascending: true })
      .limit(15)

    // Build conversation context
    const conversationHistory = (messages || []).map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content || '[media]'
    }))

    conversationHistory.push({
      role: 'user',
      content: request.message
    })

    // Get custom prompt if available
    const { data: customPrompt } = await supabase
      .from('agent_prompts')
      .select('prompt')
      .eq('user_id', request.user_id)
      .eq('agent_id', 'deck')
      .single()

    const systemPrompt = (customPrompt?.prompt || DECK_SYSTEM_PROMPT)
      .replace('{{CONTEXT}}', context || 'Nessun contesto disponibile')

    // Get Anthropic API key - Claude Sonnet for creative content
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'anthropic')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.DECK] No Anthropic API key found')
      return new Response(JSON.stringify({
        success: false,
        response: 'Preparo la presentazione e te la invio appena pronta!',
        action: 'handoff_human'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Call Anthropic Claude Sonnet (creative content generation)
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyData.api_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      console.error('[UNVRS.DECK] Anthropic error:', error)
      throw new Error('AI response failed')
    }

    const aiResult = await anthropicResponse.json()
    const aiText = aiResult.content[0]?.text || ''
    
    console.log('[UNVRS.DECK] AI response:', aiText)

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
      console.error('[UNVRS.DECK] JSON parse error:', e)
      parsedResponse = {
        response: aiText.replace(/```json|```/g, '').trim(),
        action: 'continue'
      }
    }

    // If gamma_prompt is provided and Gamma API key exists, generate deck
    if (parsedResponse.gamma_prompt) {
      const { data: gammaKey } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('user_id', request.user_id)
        .eq('provider', 'gamma')
        .single()

      if (gammaKey) {
        // TODO: Call Gamma API to generate presentation
        console.log('[UNVRS.DECK] Gamma API available, prompt:', parsedResponse.gamma_prompt)
        // For now, mark as generating - actual Gamma integration TBD
        parsedResponse.action = 'generating'
      }
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
          has_deck: !!parsedResponse.deck_content
        },
        last_activity_at: new Date().toISOString()
      })
      .eq('id', request.session_id)

    // Log agent activity
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-deck',
      user_id: request.user_id,
      log_level: 'info',
      message: `Deck generation: ${parsedResponse.action}`,
      action: parsedResponse.action,
      metadata: {
        conversation_id: request.conversation_id,
        session_id: request.session_id,
        quote_id: request.quote_id,
        brief_id: request.brief_id,
        has_deck: !!parsedResponse.deck_content,
        slide_count: parsedResponse.deck_content?.slides?.length
      },
      duration_ms: Date.now() - startTime
    })

    return new Response(JSON.stringify({
      success: true,
      response: parsedResponse.response,
      action: parsedResponse.action,
      deck_content: parsedResponse.deck_content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.DECK] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      response: 'Sto preparando la presentazione. Te la invio a breve!',
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
  
  let context = 'BRIEF PROGETTO:\n'
  if (reqs.project_type) context += `- Tipo: ${reqs.project_type}\n`
  if (reqs.description) context += `- Descrizione: ${reqs.description}\n`
  if (reqs.target) context += `- Target: ${reqs.target}\n`
  if (reqs.budget_range) context += `- Budget: ${reqs.budget_range}\n`
  if (reqs.timeline_preference) context += `- Timeline: ${reqs.timeline_preference}\n`
  
  return context
}

function buildQuoteContext(quote: any): string {
  let context = 'PREVENTIVO:\n'
  context += `- Numero: ${quote.quote_number}\n`
  context += `- Totale: €${quote.total}\n`
  context += `- Timeline: ${quote.timeline_days} giorni\n`
  
  if (quote.line_items?.length) {
    context += '\nVOCI:\n'
    quote.line_items.forEach((item: any) => {
      context += `- ${item.description}: €${item.total}\n`
    })
  }
  
  if (quote.unvrs_project_briefs) {
    context += '\n' + buildBriefContext(quote.unvrs_project_briefs)
  }
  
  return context
}
