import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HLORequest {
  conversation_id: string
  session_id: string
  user_id: string
  message: string
  sender_info: {
    type: 'client'
    client_id: string
    name?: string
  }
  channel: string
  contact_identifier: string
}

const HLO_SYSTEM_PROMPT = `Sei UNVRS.HLO, l'assistente AI per i clienti di UNVRS Labs.

CONTESTO CLIENTE:
{{CLIENT_CONTEXT}}

Il tuo obiettivo è:
1. Fornire supporto cordiale e professionale ai clienti esistenti
2. Rispondere a domande sui loro progetti
3. Gestire richieste di aggiornamenti o modifiche
4. Escalare al team umano quando necessario

COMPORTAMENTO:
- Sii professionale ma amichevole
- Usa il nome del cliente quando lo conosci
- Rispondi in modo conciso (max 3-4 frasi)
- Se la richiesta è complessa o urgente → escalare all'umano
- Se il cliente vuole un nuovo progetto → passa a INTAKE
- Per domande su fatture/pagamenti → escalare all'umano

PROGETTI ATTIVI DEL CLIENTE:
{{CLIENT_PROJECTS}}

FORMATO RISPOSTA:
Rispondi SOLO in formato JSON:
{
  "response": "Il tuo messaggio di risposta",
  "action": "continue" | "handoff_intake" | "handoff_human" | "create_ticket",
  "ticket_data": {
    "subject": "se create_ticket",
    "priority": "low" | "medium" | "high",
    "category": "support" | "billing" | "feature" | "bug"
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

    const request: HLORequest = await req.json()
    console.log('[UNVRS.HLO] Processing request:', JSON.stringify(request))

    // Get client information
    const { data: client } = await supabase
      .from('clients')
      .select('id, company_name, city, country')
      .eq('id', request.sender_info.client_id)
      .single()

    // Get client contacts
    const { data: contacts } = await supabase
      .from('client_contacts')
      .select('first_name, last_name, email')
      .eq('client_id', request.sender_info.client_id)

    // Get client projects
    const { data: projects } = await supabase
      .from('client_projects')
      .select('project_name, description')
      .eq('client_id', request.sender_info.client_id)

    // Build client context
    const clientContext = client ? `
Azienda: ${client.company_name}
Località: ${client.city}, ${client.country}
Contatti: ${contacts?.map(c => `${c.first_name} ${c.last_name}`).join(', ') || 'N/A'}
` : 'Informazioni cliente non disponibili'

    const projectsContext = projects?.length 
      ? projects.map(p => `- ${p.project_name}: ${p.description || 'Nessuna descrizione'}`).join('\n')
      : 'Nessun progetto attivo'

    // Get conversation history
    const { data: messages } = await supabase
      .from('unvrs_messages')
      .select('direction, content, content_type')
      .eq('conversation_id', request.conversation_id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Build conversation context for AI
    const conversationHistory = (messages || []).map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content || '[media]'
    }))

    conversationHistory.push({
      role: 'user',
      content: request.message
    })

    // Get Anthropic API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'anthropic')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.HLO] No Anthropic API key found')
      return new Response(JSON.stringify({
        success: false,
        response: `Ciao${request.sender_info.name ? ` ${request.sender_info.name}` : ''}! Ho ricevuto il tuo messaggio. Un membro del team ti risponderà a breve.`,
        action: 'handoff_human'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Prepare system prompt with client context
    const systemPrompt = HLO_SYSTEM_PROMPT
      .replace('{{CLIENT_CONTEXT}}', clientContext)
      .replace('{{CLIENT_PROJECTS}}', projectsContext)

    // Call Anthropic Claude
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyData.api_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      console.error('[UNVRS.HLO] Anthropic error:', error)
      throw new Error('AI response failed')
    }

    const aiResult = await anthropicResponse.json()
    const aiText = aiResult.content[0]?.text || ''
    
    console.log('[UNVRS.HLO] AI response:', aiText)

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
      console.error('[UNVRS.HLO] JSON parse error:', e)
      parsedResponse = {
        response: aiText.replace(/```json|```/g, '').trim(),
        action: 'continue'
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
          message_count: ((session?.state as any)?.message_count || 0) + 1
        },
        last_activity_at: new Date().toISOString()
      })
      .eq('id', request.session_id)

    // Log agent activity
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-hlo',
      user_id: request.user_id,
      log_level: 'info',
      message: `Processed client message, action: ${parsedResponse.action}`,
      action: parsedResponse.action,
      metadata: {
        conversation_id: request.conversation_id,
        session_id: request.session_id,
        client_id: request.sender_info.client_id,
        has_ticket: !!parsedResponse.ticket_data
      },
      duration_ms: Date.now() - startTime
    })

    return new Response(JSON.stringify({
      success: true,
      response: parsedResponse.response,
      action: parsedResponse.action,
      ticket_data: parsedResponse.ticket_data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.HLO] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      response: 'Grazie per il messaggio! Il nostro team ti risponderà a breve.',
      action: 'handoff_human',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
