import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CallRequest {
  conversation_id: string
  session_id: string
  user_id: string
  call_type: 'inbound' | 'outbound'
  caller_number: string
  callee_number?: string
  audio_stream_url?: string
  sender_info: {
    type: 'client' | 'lead' | 'public'
    client_id?: string
    lead_id?: string
    name?: string
  }
}

// Placeholder - will be replaced with user's custom prompt
const CALL_SYSTEM_PROMPT = `Sei UNVRS.CALL, l'agente AI per le chiamate vocali di UNVRS Labs.

CONTESTO CHIAMATA:
{{CALL_CONTEXT}}

Il tuo obiettivo è:
1. Gestire chiamate in entrata in modo professionale
2. Rispondere a domande frequenti
3. Raccogliere informazioni e qualificare i chiamanti
4. Trasferire a un operatore umano quando necessario

COMPORTAMENTO:
- Parla in modo naturale e professionale
- Rispondi brevemente (max 2-3 frasi per turno)
- Ascolta attentamente e conferma comprensione
- Per richieste complesse → trasferisci a operatore
- Per clienti esistenti → saluta per nome e assisti

SERVIZI UNVRS LABS (da menzionare se richiesto):
- Sviluppo software custom
- AI e automazione
- App mobile
- Consulenza tecnologica

FORMATO RISPOSTA (JSON):
{
  "speech": "Testo da pronunciare al telefono",
  "action": "continue" | "transfer_human" | "transfer_sales" | "end_call" | "schedule_callback",
  "sentiment": "positive" | "neutral" | "negative",
  "intent_detected": "descrizione dell'intento rilevato",
  "callback_data": {
    "requested_time": "se schedule_callback",
    "phone": "numero",
    "reason": "motivo callback"
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

    const request: CallRequest = await req.json()
    console.log('[UNVRS.CALL] Processing request:', JSON.stringify(request))

    // Build call context
    let callContext = `Tipo: ${request.call_type === 'inbound' ? 'Chiamata in entrata' : 'Chiamata in uscita'}\n`
    callContext += `Da: ${request.caller_number}\n`
    
    if (request.sender_info.type === 'client') {
      callContext += `Tipo chiamante: Cliente esistente\n`
      callContext += `Nome: ${request.sender_info.name || 'Non disponibile'}\n`
    } else if (request.sender_info.type === 'lead') {
      callContext += `Tipo chiamante: Lead\n`
      callContext += `Nome: ${request.sender_info.name || 'Non disponibile'}\n`
    } else {
      callContext += `Tipo chiamante: Nuovo contatto\n`
    }

    // Get custom prompt if available
    const { data: customPrompt } = await supabase
      .from('agent_prompts')
      .select('prompt')
      .eq('user_id', request.user_id)
      .eq('agent_id', 'call')
      .single()

    const systemPrompt = (customPrompt?.prompt || CALL_SYSTEM_PROMPT)
      .replace('{{CALL_CONTEXT}}', callContext)

    // For voice calls, we need OpenAI GPT for realtime voice processing
    // This is a simplified version - full implementation requires:
    // 1. Twilio/Vonage/Telnyx VoIP integration
    // 2. OpenAI Realtime API for voice-to-voice
    // 3. ElevenLabs for TTS

    // Get OpenAI API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'openai')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.CALL] No OpenAI API key found')
      return new Response(JSON.stringify({
        success: false,
        speech: 'Grazie per aver chiamato UNVRS Labs. Un operatore la richiamerà a breve.',
        action: 'transfer_human'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Note: This is a placeholder for text-based call simulation
    // Real voice calls require WebRTC/VoIP integration
    const response = {
      success: true,
      speech: 'Buongiorno, grazie per aver chiamato UNVRS Labs. Come posso aiutarla?',
      action: 'continue',
      message: 'UNVRS.CALL is ready but requires VoIP provider integration (Twilio/Vonage/Telnyx)'
    }

    // Log agent activity
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-call',
      user_id: request.user_id,
      log_level: 'info',
      message: `Call session: ${request.call_type} from ${request.caller_number}`,
      action: 'call_started',
      metadata: {
        conversation_id: request.conversation_id,
        session_id: request.session_id,
        call_type: request.call_type,
        caller: request.caller_number,
        sender_type: request.sender_info.type
      },
      duration_ms: Date.now() - startTime
    })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.CALL] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      speech: 'Ci scusi, si è verificato un problema. La richiameremo al più presto.',
      action: 'transfer_human',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
