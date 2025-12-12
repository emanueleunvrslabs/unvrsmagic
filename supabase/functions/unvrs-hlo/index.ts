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

PROGETTI ATTIVI DEL CLIENTE:
{{CLIENT_PROJECTS}}

NUMERO MESSAGGI NELLA SESSIONE (message_count): {{MESSAGE_COUNT}}

Il tuo obiettivo è:
1. Fornire supporto cordiale e professionale ai clienti esistenti
2. Rispondere a domande sui loro progetti
3. Gestire richieste di aggiornamenti o modifiche
4. Escalare al team umano quando necessario

38: COMPORTAMENTO:
39: • RISPONDI SEMPRE nella stessa lingua in cui l'utente scrive o parla (italiano, inglese, spagnolo, etc.)
40: • PRIMO MESSAGGIO DELLA SESSIONE (message_count = 1): saluta usando il nome del cliente e PRESENTATI SEMPRE così: "Ciao NOME_CLIENTE, mi chiamo HiLO, il tuo agente personale di UNVRS Labs. Come posso aiutarti?"
41: • È VIETATO usare frasi come "sono io" o simili. Non dire mai "sono io", usa sempre "mi chiamo HiLO" oppure "sono HiLO" quando ti presenti la prima volta.
• NEI MESSAGGI SUCCESSIVI (message_count > 1): non ripetere il nome del cliente né la presentazione completa, a meno che tu non stia chiaramente chiudendo la conversazione.
• QUANDO STAI CHIUDENDO LA CONVERSAZIONE: puoi usare una breve frase di saluto con il nome del cliente (esempio: "Grazie NOME_CLIENTE, a presto!") ma senza ripetere tutta la presentazione.
• Includi emoji di saluto (👋, 😊, 🙌) solo nel primo messaggio della sessione o nel saluto finale.
• Sii professionale ma amichevole e caloroso.
• Rispondi in modo conciso (max 3-4 frasi).
• Ogni risposta deve contenere almeno una frase che si riferisce in modo esplicito al contenuto dell'ULTIMO messaggio del cliente, non limitarti a ripetere sempre lo stesso saluto.
• Se la richiesta è complessa o urgente, escalare all'umano.
• Se il cliente vuole un nuovo progetto, passa a INTAKE.
• Per domande su fatture/pagamenti, escalare all'umano.
• NON usare MAI trattini (-, —, –) nelle risposte. Usa punti, virgole o frasi separate.

FORMATO RISPOSTA:
Rispondi SOLO in formato JSON:
{
  "response": "Il tuo messaggio di risposta",
  "action": "continue" | "handoff_intake" | "handoff_human" | "create_ticket",
  "ticket_data": {
    "subject": "se create_ticket",
    "priority": "low" | "medium" | "high",
    "category": "support" | "billing" | "feature" | "bug"
  },
  "complexity": "low" | "medium" | "high"
}`

// Complexity detection for model escalation
function detectComplexity(message: string, messageCount: number): 'low' | 'medium' | 'high' {
  const complexKeywords = ['preventivo', 'quote', 'prezzo', 'costo', 'budget', 'contratto', 'fattura', 'urgente', 'problema grave', 'non funziona', 'errore critico', 'nuovo progetto', 'modifica importante']
  const messageLower = message.toLowerCase()
  
  const hasComplexKeyword = complexKeywords.some(kw => messageLower.includes(kw))
  const isLongMessage = message.length > 300
  
  if (hasComplexKeyword || isLongMessage) return 'high'
  if (messageCount > 5) return 'medium'
  return 'low'
}

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

    // Get session state for message count
    const { data: session } = await supabase
      .from('unvrs_agent_sessions')
      .select('state')
      .eq('id', request.session_id)
      .single()

    const messageCount = ((session?.state as any)?.message_count || 0) + 1

    // Detect complexity to decide model escalation
    const complexity = detectComplexity(request.message, messageCount)
    console.log('[UNVRS.HLO] Detected complexity:', complexity)

    // Get OpenAI API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'openai')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.HLO] No OpenAI API key found')
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
      .replace('{{MESSAGE_COUNT}}', String(messageCount))

    // Select model based on complexity:
    // - low/medium: GPT-5 mini (cost-optimized)
    // - high: GPT-5.2 Pro (maximum quality)
    const model = complexity === 'high' ? 'gpt-5-2025-08-07' : 'gpt-5-mini-2025-08-07'
    console.log('[UNVRS.HLO] Using model:', model)

    // Call OpenAI GPT
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyData.api_key}`
      },
      body: JSON.stringify({
        model: model,
        max_completion_tokens: 500,
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
      console.error('[UNVRS.HLO] OpenAI error:', error)
      throw new Error('AI response failed')
    }

    const aiResult = await openaiResponse.json()
    console.log('[UNVRS.HLO] Raw AI result:', JSON.stringify(aiResult))
    const aiText = aiResult.choices?.[0]?.message?.content || ''
    
    console.log('[UNVRS.HLO] AI response text:', aiText)

    // Parse AI response
    let parsedResponse: any
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

    // Safety fallback: se per qualsiasi motivo la response è vuota,
    // mandiamo comunque un messaggio di conferma al cliente
    if (!parsedResponse.response || String(parsedResponse.response).trim() === '') {
      const name = request.sender_info.name || ''
      const lastUserMessage = request.message
      if (messageCount === 1) {
        parsedResponse.response = `Ciao${name ? ` ${name}` : ''}! 👋 Mi chiamo HiLO, il tuo agente personale di UNVRS Labs. Ho ricevuto il tuo messaggio, dimmi pure come posso aiutarti.`
      } else {
        parsedResponse.response = `Mi hai appena chiesto: "${lastUserMessage}". Ti risponde il tuo agente personale HiLO di UNVRS Labs e mi concentro sempre sull’ultima domanda che fai, quindi ti aiuto proprio su questo messaggio.`
      }
      if (!parsedResponse.action) {
        parsedResponse.action = 'continue'
      }
    }

    await supabase
      .from('unvrs_agent_sessions')
      .update({
        state: {
          ...((session?.state as object) || {}),
          last_action: parsedResponse.action,
          message_count: messageCount,
          last_model_used: model,
          last_complexity: complexity
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
        has_ticket: !!parsedResponse.ticket_data,
        model_used: model,
        complexity: complexity
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
