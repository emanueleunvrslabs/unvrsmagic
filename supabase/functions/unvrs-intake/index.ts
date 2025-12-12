import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntakeRequest {
  conversation_id: string
  session_id: string
  user_id: string
  message: string
  sender_info: {
    type: 'client' | 'lead' | 'public'
    client_id?: string
    lead_id?: string
    name?: string
  }
  channel: string
  contact_identifier: string
}

// Placeholder - will be replaced with user's custom prompt
const INTAKE_SYSTEM_PROMPT = `Sei UNVRS.INTAKE, l'agente AI di raccolta requisiti per UNVRS Labs.

Il tuo obiettivo è raccogliere in modo strutturato tutte le informazioni necessarie per un preventivo:

STEP DI RACCOLTA:
1. TIPO PROGETTO: Web App, Mobile App, Sito Web, Automazione AI, Chatbot, Marketing, Consulenza, Altro
2. DESCRIZIONE: Cosa deve fare il progetto? Funzionalità principali?
3. TARGET: Chi sono gli utenti? B2B/B2C? Settore?
4. BUDGET: Range indicativo? (<5k, 5-15k, 15-30k, 30-50k, >50k)
5. TIMELINE: Urgenza? Deadline specifiche?
6. INTEGRAZIONI: Sistemi esistenti da integrare? API terze parti?
7. DESIGN: Hai già un design? Brand guidelines?

COMPORTAMENTO:
- Fai UNA domanda alla volta
- Conferma le informazioni raccolte
- Sii professionale ma cordiale
- Quando hai tutte le info → passa a QUOTE
- Max 2-3 frasi per risposta

FORMATO RISPOSTA (JSON):
{
  "response": "Tuo messaggio",
  "action": "continue" | "handoff_quote" | "handoff_human",
  "collected_step": "step appena completato (project_type, description, target, budget, timeline, integrations, design)",
  "step_value": "valore raccolto per questo step",
  "progress": {
    "completed_steps": ["lista step completati"],
    "next_step": "prossimo step da raccogliere",
    "ready_for_quote": true/false
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

    const request: IntakeRequest = await req.json()
    console.log('[UNVRS.INTAKE] Processing request:', JSON.stringify(request))

    // Get conversation history
    const { data: messages } = await supabase
      .from('unvrs_messages')
      .select('direction, content, content_type')
      .eq('conversation_id', request.conversation_id)
      .order('created_at', { ascending: true })
      .limit(30)

    // Get current session state
    const { data: session } = await supabase
      .from('unvrs_agent_sessions')
      .select('state, context')
      .eq('id', request.session_id)
      .single()

    // Get or create project brief
    let brief = await getOrCreateBrief(supabase, request)
    console.log('[UNVRS.INTAKE] Brief:', brief.id)

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
      .eq('agent_id', 'intake')
      .single()

    const systemPrompt = customPrompt?.prompt || INTAKE_SYSTEM_PROMPT

    // Get Anthropic API key - use Claude Sonnet for structured extraction
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'anthropic')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.INTAKE] No Anthropic API key found')
      return new Response(JSON.stringify({
        success: false,
        response: 'Grazie! Ho preso nota. Un membro del team ti contatterà per i dettagli.',
        action: 'handoff_human'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Add brief context to prompt
    const briefContext = buildBriefContext(brief)
    const fullPrompt = `${systemPrompt}\n\nBRIEF ATTUALE:\n${briefContext}`

    // Call Anthropic Claude Sonnet (good at structured extraction)
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyData.api_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: fullPrompt,
        messages: conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      console.error('[UNVRS.INTAKE] Anthropic error:', error)
      throw new Error('AI response failed')
    }

    const aiResult = await anthropicResponse.json()
    const aiText = aiResult.content[0]?.text || ''
    
    console.log('[UNVRS.INTAKE] AI response:', aiText)

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
      console.error('[UNVRS.INTAKE] JSON parse error:', e)
      parsedResponse = {
        response: aiText.replace(/```json|```/g, '').trim(),
        action: 'continue'
      }
    }

    // Update brief with collected data
    if (parsedResponse.collected_step && parsedResponse.step_value) {
      await updateBrief(supabase, brief.id, parsedResponse.collected_step, parsedResponse.step_value, parsedResponse.progress)
    }

    // Update session state
    const newState = {
      ...((session?.state as object) || {}),
      last_action: parsedResponse.action,
      message_count: ((session?.state as any)?.message_count || 0) + 1,
      progress: parsedResponse.progress
    }

    await supabase
      .from('unvrs_agent_sessions')
      .update({
        state: newState,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', request.session_id)

    // Log agent activity
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-intake',
      user_id: request.user_id,
      log_level: 'info',
      message: `Processed intake step: ${parsedResponse.collected_step || 'conversation'}`,
      action: parsedResponse.action,
      metadata: {
        conversation_id: request.conversation_id,
        session_id: request.session_id,
        brief_id: brief.id,
        collected_step: parsedResponse.collected_step,
        progress: parsedResponse.progress
      },
      duration_ms: Date.now() - startTime
    })

    return new Response(JSON.stringify({
      success: true,
      response: parsedResponse.response,
      action: parsedResponse.action,
      brief_id: brief.id,
      progress: parsedResponse.progress
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.INTAKE] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      response: 'Grazie per le informazioni! Ti ricontatteremo presto.',
      action: 'handoff_human',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function getOrCreateBrief(supabase: any, request: IntakeRequest) {
  // Check for existing brief
  const { data: existingBrief } = await supabase
    .from('unvrs_project_briefs')
    .select('*')
    .eq('conversation_id', request.conversation_id)
    .in('status', ['in_progress', 'collecting'])
    .single()

  if (existingBrief) return existingBrief

  // Create new brief
  const { data: newBrief, error } = await supabase
    .from('unvrs_project_briefs')
    .insert({
      user_id: request.user_id,
      conversation_id: request.conversation_id,
      lead_id: request.sender_info.lead_id,
      client_id: request.sender_info.client_id,
      status: 'collecting',
      collected_steps: [],
      requirements: {}
    })
    .select()
    .single()

  if (error) {
    console.error('[UNVRS.INTAKE] Error creating brief:', error)
    throw error
  }

  return newBrief
}

function buildBriefContext(brief: any): string {
  const reqs = brief.requirements || {}
  const steps = brief.collected_steps || []
  
  let context = `Step completati: ${steps.length > 0 ? steps.join(', ') : 'nessuno'}\n`
  
  if (reqs.project_type) context += `Tipo progetto: ${reqs.project_type}\n`
  if (reqs.description) context += `Descrizione: ${reqs.description}\n`
  if (reqs.target) context += `Target: ${reqs.target}\n`
  if (reqs.budget_range) context += `Budget: ${reqs.budget_range}\n`
  if (reqs.timeline) context += `Timeline: ${reqs.timeline}\n`
  if (reqs.integrations) context += `Integrazioni: ${reqs.integrations}\n`
  if (reqs.design) context += `Design: ${reqs.design}\n`
  
  return context
}

async function updateBrief(
  supabase: any, 
  briefId: string, 
  step: string, 
  value: string,
  progress: any
) {
  const { data: current } = await supabase
    .from('unvrs_project_briefs')
    .select('collected_steps, requirements')
    .eq('id', briefId)
    .single()

  const steps = current?.collected_steps || []
  const reqs = current?.requirements || {}

  if (!steps.includes(step)) {
    steps.push(step)
  }

  // Map step to requirement field
  const stepMap: Record<string, string> = {
    'project_type': 'project_type',
    'description': 'description',
    'target': 'target',
    'budget': 'budget_range',
    'timeline': 'timeline_preference',
    'integrations': 'integrations',
    'design': 'design'
  }

  if (stepMap[step]) {
    reqs[stepMap[step]] = value
  }

  const updateData: any = {
    collected_steps: steps,
    requirements: reqs,
    updated_at: new Date().toISOString()
  }

  // Check if ready for quote
  if (progress?.ready_for_quote) {
    updateData.status = 'completed'
    updateData.completed_at = new Date().toISOString()
  }

  await supabase
    .from('unvrs_project_briefs')
    .update(updateData)
    .eq('id', briefId)
}
