import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SwitchRequest {
  conversation_id: string
  session_id: string
  user_id: string
  message: string
  sender_info: {
    type: 'lead' | 'public'
    lead_id?: string
    name?: string
  }
  channel: string
  contact_identifier: string
}

const SWITCH_SYSTEM_PROMPT = `Sei UNVRS.SWITCH, l'assistente AI di qualificazione per UNVRS Labs.

Il tuo obiettivo è:
1. Accogliere in modo professionale e amichevole
2. Capire cosa cerca il visitatore (informazioni, preventivo, supporto, demo, altro)
3. Raccogliere informazioni base: nome, azienda (se applicabile), email
4. Qualificare l'interesse e indirizzare all'agente giusto
5. SE il visitatore vuole una DEMO di un progetto, gestire la prenotazione

SERVIZI UNVRS LABS:
• Sviluppo Web/Mobile (app, siti, piattaforme)
• AI & Automazione (chatbot, agenti AI, automazioni)
• Marketing Digitale (social media, contenuti AI)
• Consulenza Tecnologica

PROGETTI DISPONIBILI PER DEMO:
• Energizzo: Piattaforma gestionale per aziende energetiche
• AI Social: Automazione social media con AI
• NKMT: Trading algoritmico con agenti AI

GESTIONE RICHIESTE DEMO:
Quando un visitatore vuole una demo:
1. Chiedi quale progetto gli interessa (se non specificato)
2. Chiedi il nome per la prenotazione
3. Proponi le date/orari disponibili (li troverai nel campo "demo_slots" se presente)
4. Quando conferma data e ora, usa action "book_demo" con i dati raccolti
5. Gli orari disponibili sono: mattina 11:00/13:00, pomeriggio 15:00/18:00, dal lunedì al venerdì

COMPORTAMENTO:
• Sii conciso ma cordiale (max 2-3 frasi per risposta)
• Fai una domanda alla volta
• Se il visitatore vuole un preventivo, passa a INTAKE
• Se il visitatore è un cliente esistente, passa a HLO
• Se vuole una DEMO, gestisci tu la prenotazione
• Se ha domande generiche, rispondi direttamente
• NON usare MAI trattini (-, —, –) nelle risposte. Usa punti, virgole o frasi separate.

FORMATO RISPOSTA:
Rispondi SOLO in formato JSON:
{
  "response": "Il tuo messaggio di risposta",
  "action": "continue" | "handoff_intake" | "handoff_hlo" | "handoff_human" | "check_demo_availability" | "book_demo",
  "collected_data": {
    "name": "se raccolto",
    "company": "se raccolto",
    "email": "se raccolto",
    "phone": "se raccolto",
    "interest": "tipo di interesse rilevato",
    "project_type": "energizzo | ai-social | nkmt (solo per demo)",
    "demo_date": "YYYY-MM-DD (solo per book_demo)",
    "demo_time": "HH:mm (solo per book_demo)",
    "qualified": true/false
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

    const request: SwitchRequest = await req.json()
    console.log('[UNVRS.SWITCH] Processing request:', JSON.stringify(request))

    // Get conversation history
    const { data: messages } = await supabase
      .from('unvrs_messages')
      .select('direction, content, content_type')
      .eq('conversation_id', request.conversation_id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Get current session state
    const { data: session } = await supabase
      .from('unvrs_agent_sessions')
      .select('state, context')
      .eq('id', request.session_id)
      .single()

    // Check if we need to fetch demo availability
    const sessionState = (session?.state as any) || {}
    let demoContext = ''
    
    if (sessionState.wants_demo || request.message.toLowerCase().includes('demo')) {
      // Fetch available demo slots
      const availabilityResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-demo-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ user_id: request.user_id, days_ahead: 7 })
      })
      
      if (availabilityResponse.ok) {
        const availability = await availabilityResponse.json()
        if (availability.success && availability.suggestions?.length > 0) {
          demoContext = `\n\nSLOT DEMO DISPONIBILI:\n${availability.suggestions.map((s: any) => 
            `• ${s.date_formatted} alle ${s.time}`
          ).join('\n')}\n\nUsa queste date quando proponi slot per la demo.`
        }
      }
    }

    // Build conversation context for AI
    const conversationHistory = (messages || []).map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content || '[media]'
    }))

    // Add current message
    conversationHistory.push({
      role: 'user',
      content: request.message
    })

    // Get Anthropic API key for Claude Haiku 4.5 (fast/cheap for triage)
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'anthropic')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.SWITCH] No Anthropic API key found')
      return new Response(JSON.stringify({
        success: false,
        response: 'Grazie per il messaggio! Un operatore ti risponderà a breve.',
        action: 'handoff_human'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build system prompt with demo context if available
    const systemPrompt = SWITCH_SYSTEM_PROMPT + demoContext

    // Call Anthropic Claude Haiku 4.5 (primary for SWITCH - fast/cheap triage)
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
        messages: conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      console.error('[UNVRS.SWITCH] Anthropic error:', error)
      throw new Error('AI response failed')
    }

    const aiResult = await anthropicResponse.json()
    const aiText = aiResult.content[0]?.text || ''
    
    console.log('[UNVRS.SWITCH] AI response:', aiText)

    // Parse AI response
    let parsedResponse
    try {
      // Extract JSON from response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = {
          response: aiText,
          action: 'continue',
          collected_data: {}
        }
      }
    } catch (e) {
      console.error('[UNVRS.SWITCH] JSON parse error:', e)
      parsedResponse = {
        response: aiText.replace(/```json|```/g, '').trim(),
        action: 'continue',
        collected_data: {}
      }
    }

    // Handle book_demo action
    if (parsedResponse.action === 'book_demo') {
      const demoData = parsedResponse.collected_data
      
      if (demoData.demo_date && demoData.demo_time && demoData.name && demoData.project_type) {
        const bookingResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/book-demo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            user_id: request.user_id,
            date: demoData.demo_date,
            time: demoData.demo_time,
            client_name: demoData.name,
            client_phone: request.channel === 'whatsapp' ? request.contact_identifier : demoData.phone,
            client_email: demoData.email,
            project_type: demoData.project_type,
            conversation_id: request.conversation_id,
            lead_id: request.sender_info.lead_id
          })
        })

        const bookingResult = await bookingResponse.json()
        
        if (bookingResult.success) {
          parsedResponse.response = bookingResult.message
          parsedResponse.action = 'continue' // Stay in conversation
          parsedResponse.collected_data.demo_booked = true
          parsedResponse.collected_data.booking_id = bookingResult.booking.id
        } else {
          // Booking failed, inform user
          parsedResponse.response = `Mi dispiace, c'è stato un problema con la prenotazione: ${bookingResult.error}. Vuoi provare un altro orario?`
          parsedResponse.action = 'check_demo_availability'
        }
      }
    }

    // Update session state with collected data
    const newState = {
      ...sessionState,
      ...parsedResponse.collected_data,
      last_action: parsedResponse.action,
      wants_demo: parsedResponse.action === 'check_demo_availability' || 
                  parsedResponse.collected_data?.project_type || 
                  sessionState.wants_demo,
      message_count: (sessionState.message_count || 0) + 1
    }

    await supabase
      .from('unvrs_agent_sessions')
      .update({
        state: newState,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', request.session_id)

    // If lead is qualified, create/update lead record
    if (parsedResponse.collected_data?.name || parsedResponse.collected_data?.email) {
      await createOrUpdateLead(supabase, request, parsedResponse.collected_data)
    }

    // Log agent activity
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-switch',
      user_id: request.user_id,
      log_level: 'info',
      message: `Processed message, action: ${parsedResponse.action}`,
      action: parsedResponse.action,
      metadata: {
        conversation_id: request.conversation_id,
        session_id: request.session_id,
        collected_data: parsedResponse.collected_data,
        demo_context: demoContext ? 'included' : 'none'
      },
      duration_ms: Date.now() - startTime
    })

    return new Response(JSON.stringify({
      success: true,
      response: parsedResponse.response,
      action: parsedResponse.action,
      collected_data: parsedResponse.collected_data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.SWITCH] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      response: 'Grazie per il messaggio! Un operatore ti risponderà a breve.',
      action: 'handoff_human',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createOrUpdateLead(
  supabase: any,
  request: SwitchRequest,
  collectedData: any
) {
  try {
    // Check if lead already exists
    if (request.sender_info.lead_id) {
      // Update existing lead
      await supabase
        .from('unvrs_leads')
        .update({
          name: collectedData.name || undefined,
          company: collectedData.company || undefined,
          email: collectedData.email || undefined,
          status: collectedData.qualified ? 'qualified' : 'contacted',
          qualified_at: collectedData.qualified ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.sender_info.lead_id)
    } else if (collectedData.name || collectedData.email) {
      // Create new lead
      const { data: newLead } = await supabase
        .from('unvrs_leads')
        .insert({
          user_id: request.user_id,
          phone: request.channel === 'whatsapp' ? request.contact_identifier : null,
          email: collectedData.email,
          name: collectedData.name,
          company: collectedData.company,
          source_channel: request.channel,
          source_conversation_id: request.conversation_id,
          status: 'contacted',
          metadata: { interest: collectedData.interest }
        })
        .select('id')
        .single()

      // Update conversation with lead_id
      if (newLead) {
        await supabase
          .from('unvrs_conversations')
          .update({ lead_id: newLead.id })
          .eq('id', request.conversation_id)
      }
    }
  } catch (error) {
    console.error('[UNVRS.SWITCH] Error creating/updating lead:', error)
  }
}
