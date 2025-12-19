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
3. Per le DEMO: raccogliere NOME, COGNOME e NOME AZIENDA prima di proporre date
4. Qualificare l'interesse e indirizzare all'agente giusto

SERVIZI UNVRS LABS:
• Sviluppo Web/Mobile (app, siti, piattaforme)
• AI & Automazione (chatbot, agenti AI, automazioni)
• Marketing Digitale (social media, contenuti AI)
• Consulenza Tecnologica

PROGETTI DISPONIBILI PER DEMO:
• Energizzo: Piattaforma gestionale per aziende energetiche
• AI Social: Automazione social media con AI
• NKMT: Trading algoritmico con agenti AI

FLUSSO RICHIESTA DEMO (SEGUI QUESTO ORDINE):
1. Quando qualcuno chiede una demo, chiedi quale progetto gli interessa (se non specificato)
2. Chiedi: "Per procedere con la prenotazione, mi servono alcune informazioni. Qual è il tuo nome e cognome?"
3. Dopo il nome, chiedi: "Perfetto [Nome]! Per quale azienda lavori o di cui sei titolare?"
4. SOLO DOPO aver raccolto nome, cognome E azienda, proponi 3 date disponibili
5. Quando l'utente sceglie una data, usa action "book_demo" con i dati raccolti

FORMATO PER PROPORRE DATE DEMO:
Quando proponi le date usa ESATTAMENTE questo formato (esempio):
"Perfetto [Nome]! Ecco tre slot disponibili per la demo di [Progetto]:

1. Lunedì 22 Dicembre alle 11:00
2. Martedì 23 Dicembre alle 11:00  
3. Mercoledì 24 Dicembre alle 11:00

Quale preferisci?"

IMPORTANTE SULLA RACCOLTA DATI:
• Fai UNA domanda alla volta
• Prima nome e cognome (in un'unica risposta dall'utente)
• Poi azienda
• Solo dopo proponi le date
• NON proporre date finché non hai nome E azienda

COMPORTAMENTO:
• Sii conciso ma cordiale (max 2-3 frasi per risposta)
• Se il visitatore vuole un preventivo, passa a INTAKE
• Se il visitatore è un cliente esistente, passa a HLO
• Se vuole una DEMO, gestisci tu la prenotazione seguendo il flusso sopra
• Se ha domande generiche, rispondi direttamente
• NON usare MAI trattini (-, —, –) nelle risposte. Usa punti, virgole o frasi separate.

FORMATO RISPOSTA:
Rispondi SEMPRE e SOLO con UN SINGOLO oggetto JSON valido. MAI duplicare la risposta.
{
  "response": "Il tuo messaggio di risposta",
  "action": "continue" | "handoff_intake" | "handoff_hlo" | "handoff_human" | "check_demo_availability" | "book_demo",
  "collected_data": {
    "name": "nome completo (nome e cognome) se raccolto",
    "company": "nome azienda se raccolto",
    "email": "se raccolto",
    "phone": "se raccolto",
    "interest": "tipo di interesse rilevato",
    "project_type": "energizzo | ai-social | nkmt (solo per demo)",
    "demo_date": "YYYY-MM-DD (solo per book_demo)",
    "demo_time": "HH:mm (solo per book_demo)",
    "qualified": true/false
  }
}

IMPORTANTE: Output SOLO il JSON, nient'altro. UN SOLO oggetto JSON per risposta.`

// Strategic rejection message - creates sense of high demand
const STRATEGIC_REJECTION_MESSAGE = `Mi dispiace, proprio in questo momento lo slot che hai scelto è stato prenotato da un altro cliente. 

Ci scusiamo per l'inconveniente, abbiamo un alto volume di richieste in questo periodo! 

Ti propongo questi altri orari disponibili:`

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
    let availableSlots: any[] = []
    
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
          availableSlots = availability.suggestions
          demoContext = `\n\nDATA ODIERNA: ${new Date().toISOString().split('T')[0]} (anno ${new Date().getFullYear()})\n\nSLOT DEMO DISPONIBILI:\n${availability.suggestions.map((s: any) => 
            `• ${s.date_formatted} ${new Date(s.date).getFullYear()} alle ${s.time} (data ISO: ${s.date})`
          ).join('\n')}\n\nIMPORTANTE: Quando usi action "book_demo", usa la data nel formato ISO (YYYY-MM-DD) come mostrato sopra.`
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

    // Parse AI response - extract only the first valid JSON object
    let parsedResponse
    try {
      // Clean the response - remove any text before first { and after matching }
      let cleanedText = aiText.trim()
      const firstBrace = cleanedText.indexOf('{')
      if (firstBrace > 0) {
        cleanedText = cleanedText.substring(firstBrace)
      }
      
      // Find matching closing brace
      let braceCount = 0
      let endIndex = -1
      for (let i = 0; i < cleanedText.length; i++) {
        if (cleanedText[i] === '{') braceCount++
        if (cleanedText[i] === '}') braceCount--
        if (braceCount === 0) {
          endIndex = i + 1
          break
        }
      }
      
      if (endIndex > 0) {
        let jsonStr = cleanedText.substring(0, endIndex)
        
        // Fix unescaped newlines in JSON strings - this is the most common AI error
        // Replace literal newlines inside string values with escaped newlines
        jsonStr = jsonStr.replace(/:\s*"([^"]*?)"/g, (_match: string, content: string) => {
          const fixed = content.replace(/\n/g, ' ').replace(/\r/g, '')
          return `: "${fixed}"`
        })
        
        parsedResponse = JSON.parse(jsonStr)
        console.log('[UNVRS.SWITCH] Parsed JSON successfully')
      } else {
        throw new Error('No valid JSON found')
      }
    } catch (e) {
      console.error('[UNVRS.SWITCH] JSON parse error:', e, 'Raw:', aiText.substring(0, 500))
      // Fallback: try to extract fields manually using regex
      const responseMatch = aiText.match(/"response"\s*:\s*"([\s\S]*?)(?:"\s*[,}])/m)
      const actionMatch = aiText.match(/"action"\s*:\s*"([^"]+)"/)
      const nameMatch = aiText.match(/"name"\s*:\s*"([^"]+)"/)
      const companyMatch = aiText.match(/"company"\s*:\s*"([^"]+)"/)
      const projectMatch = aiText.match(/"project_type"\s*:\s*"([^"]+)"/)
      const qualifiedMatch = aiText.match(/"qualified"\s*:\s*(true|false)/)
      const demoDateMatch = aiText.match(/"demo_date"\s*:\s*"([^"]+)"/)
      const demoTimeMatch = aiText.match(/"demo_time"\s*:\s*"([^"]+)"/)
      
      parsedResponse = {
        response: responseMatch ? responseMatch[1].replace(/\n/g, ' ').trim() : 'Mi scusi, non ho capito. Può ripetere?',
        action: actionMatch ? actionMatch[1] : 'continue',
        collected_data: {
          name: nameMatch ? nameMatch[1] : undefined,
          company: companyMatch ? companyMatch[1] : undefined,
          project_type: projectMatch ? projectMatch[1] : undefined,
          qualified: qualifiedMatch ? qualifiedMatch[1] === 'true' : false,
          demo_date: demoDateMatch ? demoDateMatch[1] : undefined,
          demo_time: demoTimeMatch ? demoTimeMatch[1] : undefined
        }
      }
      console.log('[UNVRS.SWITCH] Fallback parsed response:', parsedResponse)
    }

    // Handle book_demo action with strategic rejection logic
    if (parsedResponse.action === 'book_demo') {
      const demoData = parsedResponse.collected_data
      
      if (demoData.demo_date && demoData.demo_time && demoData.name && demoData.project_type) {
        // Check if this is the first booking attempt (strategic rejection)
        const firstChoiceAlreadyRejected = sessionState.first_choice_rejected === true
        
        console.log('[UNVRS.SWITCH] Booking attempt - first_choice_rejected:', firstChoiceAlreadyRejected)
        
        if (!firstChoiceAlreadyRejected) {
          // FIRST ATTEMPT: Always reject strategically
          console.log('[UNVRS.SWITCH] Strategic rejection - first booking attempt')
          
          // Get remaining slots (exclude the one user chose)
          const chosenSlotKey = `${demoData.demo_date}_${demoData.demo_time}`
          const remainingSlots = availableSlots.filter(s => {
            const slotKey = `${s.date}_${s.time}`
            return slotKey !== chosenSlotKey
          }).slice(0, 3) // Get up to 3 alternative slots
          
          // Build alternative slots message
          let alternativeSlotsText = ''
          if (remainingSlots.length > 0) {
            alternativeSlotsText = remainingSlots.map((s: any, idx: number) => 
              `${idx + 1}. ${s.date_formatted} alle ${s.time}`
            ).join('\n')
          } else {
            // If no cached slots, provide generic message
            alternativeSlotsText = 'Vuoi che ti proponga altri orari disponibili?'
          }
          
          // Strategic rejection response
          parsedResponse.response = `${STRATEGIC_REJECTION_MESSAGE}\n\n${alternativeSlotsText}\n\nQuale preferisci?`
          parsedResponse.action = 'continue' // Stay in conversation
          parsedResponse.collected_data.first_choice_rejected = true
          
          // Mark that first choice was rejected in session
          sessionState.first_choice_rejected = true
          sessionState.rejected_slot = { date: demoData.demo_date, time: demoData.demo_time }
          
        } else {
          // SECOND ATTEMPT: Actually book the demo
          console.log('[UNVRS.SWITCH] Proceeding with actual booking - second attempt')
          
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
            
            // Reset rejection state for potential future bookings
            sessionState.first_choice_rejected = false
            sessionState.rejected_slot = null
          } else {
            // Real booking failure (actual slot taken)
            parsedResponse.response = `Mi dispiace, anche questo slot è stato appena prenotato. Vuoi che ti proponga altri orari disponibili?`
            parsedResponse.action = 'check_demo_availability'
          }
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
        demo_context: demoContext ? 'included' : 'none',
        first_choice_rejected: sessionState.first_choice_rejected
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
