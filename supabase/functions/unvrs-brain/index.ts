import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AudioMessageData {
  url: string
  mimetype?: string
  mediaKey: string
  fileSha256?: string
  fileLength?: string
  seconds?: number
  messageId?: string
}

interface IncomingMessage {
  channel: 'whatsapp' | 'telegram' | 'instagram' | 'linkedin' | 'phone' | 'email'
  contact_identifier: string // phone number, telegram user id, etc.
  contact_name?: string
  content_type: 'text' | 'voice' | 'image' | 'document' | 'video'
  content?: string
  media_url?: string
  audio_message_data?: AudioMessageData
  metadata?: Record<string, any>
}

interface BrainResponse {
  success: boolean
  conversation_id: string
  routed_to_agent: string
  response?: string
  response_type?: 'text' | 'audio'
  audio_url?: string
  action?: string
  error?: string
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

    const message: IncomingMessage = await req.json()
    console.log('[UNVRS.BRAIN] Received message:', JSON.stringify(message))

    // Step 1: Get owner user_id (the system owner)
    const { data: ownerRole, error: ownerError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'owner')
      .single()

    if (ownerError || !ownerRole) {
      console.error('[UNVRS.BRAIN] Failed to get owner:', ownerError)
      throw new Error('System owner not configured')
    }

    const ownerId = ownerRole.user_id
    console.log('[UNVRS.BRAIN] Owner ID:', ownerId)

    // Step 2: Normalize contact identifier
    const normalizedContact = normalizeContactIdentifier(message.channel, message.contact_identifier)
    console.log('[UNVRS.BRAIN] Normalized contact:', normalizedContact)

    // Step 3: Find or create conversation
    let conversation = await findActiveConversation(supabase, ownerId, message.channel, normalizedContact)
    
    if (!conversation) {
      conversation = await createConversation(supabase, ownerId, message, normalizedContact)
      console.log('[UNVRS.BRAIN] Created new conversation:', conversation.id)
    } else {
      console.log('[UNVRS.BRAIN] Found existing conversation:', conversation.id)
    }

    // Step 4: Store the incoming message
    await storeMessage(supabase, ownerId, conversation.id, message, 'inbound')

    // Step 5: Identify sender type (client, lead, or public)
    const senderInfo = await identifySender(supabase, ownerId, message.channel, normalizedContact)
    console.log('[UNVRS.BRAIN] Sender info:', JSON.stringify(senderInfo))

    // Step 6: Update conversation with client/lead info if found
    if (senderInfo.client_id || senderInfo.lead_id) {
      await supabase
        .from('unvrs_conversations')
        .update({
          client_id: senderInfo.client_id,
          lead_id: senderInfo.lead_id,
          contact_name: senderInfo.name || message.contact_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id)
    }

    // Step 7: Determine which agent should handle this
    const routingDecision = await determineRouting(supabase, conversation, senderInfo, message)
    console.log('[UNVRS.BRAIN] Routing decision:', routingDecision)

    // Step 8: Update conversation with current agent
    await supabase
      .from('unvrs_conversations')
      .update({
        current_agent: routingDecision.agent,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    // Step 9: Create or update agent session
    const session = await getOrCreateAgentSession(supabase, ownerId, conversation.id, routingDecision.agent)
    console.log('[UNVRS.BRAIN] Agent session:', session.id)

    // Step 10: Log to agent_logs
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-brain',
      user_id: ownerId,
      log_level: 'info',
      message: `Routed ${message.channel} message to ${routingDecision.agent}`,
      action: 'route_message',
      metadata: {
        conversation_id: conversation.id,
        channel: message.channel,
        sender_type: senderInfo.type,
        content_type: message.content_type,
        routed_to: routingDecision.agent
      },
      duration_ms: Date.now() - startTime
    })

    // Step 11: If voice message, transcribe it
    let processedContent = message.content
    if (message.content_type === 'voice' && message.media_url) {
      processedContent = await transcribeVoice(supabase, ownerId, message.media_url, message.audio_message_data)
      console.log('[UNVRS.BRAIN] Transcribed voice:', processedContent)
      
      // Update message with transcription
      await supabase
        .from('unvrs_messages')
        .update({ transcription: processedContent })
        .eq('conversation_id', conversation.id)
        .eq('media_url', message.media_url)
    }

    // Step 12: Generate response based on routing
    const response = await generateAgentResponse(
      supabase, 
      ownerId, 
      conversation, 
      session, 
      routingDecision, 
      senderInfo, 
      processedContent || message.content || '',
      message
    )

    // Step 13: If original message was voice, convert response to audio
    let responseType: 'text' | 'audio' = 'text'
    let audioUrl: string | undefined
    
    if (message.content_type === 'voice' && response.text) {
      console.log('[UNVRS.BRAIN] Original was voice message, converting response to audio...')
      audioUrl = await textToSpeech(supabase, ownerId, response.text)
      if (audioUrl) {
        responseType = 'audio'
        console.log('[UNVRS.BRAIN] Audio generated:', audioUrl)
      }
    }

    // Step 14: Store outbound message if response generated
    if (response.text) {
      await storeMessage(supabase, ownerId, conversation.id, {
        channel: message.channel,
        contact_identifier: normalizedContact,
        content_type: responseType === 'audio' ? 'voice' : 'text',
        content: response.text,
        media_url: audioUrl,
        metadata: { agent: routingDecision.agent }
      }, 'outbound')
    }

    const brainResponse: BrainResponse = {
      success: true,
      conversation_id: conversation.id,
      routed_to_agent: routingDecision.agent,
      response: response.text,
      response_type: responseType,
      audio_url: audioUrl,
      action: response.action
    }

    console.log('[UNVRS.BRAIN] Response:', JSON.stringify(brainResponse))

    return new Response(JSON.stringify(brainResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[UNVRS.BRAIN] Error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Helper Functions

function normalizeContactIdentifier(channel: string, identifier: string): string {
  if (channel === 'whatsapp' || channel === 'phone') {
    // Remove all non-numeric except leading +
    return identifier.replace(/[^\d+]/g, '').replace(/^\+/, '')
  }
  return identifier.toLowerCase().trim()
}

async function findActiveConversation(
  supabase: any, 
  ownerId: string, 
  channel: string, 
  contact: string
) {
  const { data, error } = await supabase
    .from('unvrs_conversations')
    .select('*')
    .eq('user_id', ownerId)
    .eq('channel', channel)
    .eq('contact_identifier', contact)
    .in('status', ['active', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[UNVRS.BRAIN] Error finding conversation:', error)
  }
  return data
}

async function createConversation(
  supabase: any, 
  ownerId: string, 
  message: IncomingMessage, 
  normalizedContact: string
) {
  const { data, error } = await supabase
    .from('unvrs_conversations')
    .insert({
      user_id: ownerId,
      channel: message.channel,
      contact_identifier: normalizedContact,
      contact_name: message.contact_name,
      current_agent: 'brain',
      status: 'active',
      metadata: message.metadata || {}
    })
    .select()
    .single()

  if (error) {
    console.error('[UNVRS.BRAIN] Error creating conversation:', error)
    throw error
  }
  return data
}

async function storeMessage(
  supabase: any, 
  ownerId: string, 
  conversationId: string, 
  message: IncomingMessage, 
  direction: 'inbound' | 'outbound'
) {
  const { error } = await supabase
    .from('unvrs_messages')
    .insert({
      user_id: ownerId,
      conversation_id: conversationId,
      direction,
      content_type: message.content_type,
      content: message.content,
      media_url: message.media_url,
      metadata: message.metadata || {}
    })

  if (error) {
    console.error('[UNVRS.BRAIN] Error storing message:', error)
  }
}

async function identifySender(
  supabase: any, 
  ownerId: string, 
  channel: string, 
  contact: string
): Promise<{ type: 'client' | 'lead' | 'public', client_id?: string, lead_id?: string, name?: string }> {
  
  // Check if it's an existing client by phone or email
  if (channel === 'whatsapp' || channel === 'phone') {
    const { data: clientContact } = await supabase
      .from('client_contacts')
      .select('client_id, first_name, last_name, clients!inner(id, user_id)')
      .ilike('whatsapp_number', `%${contact}%`)
      .limit(1)
      .single()

    if (clientContact) {
      return {
        type: 'client',
        client_id: clientContact.client_id,
        name: `${clientContact.first_name} ${clientContact.last_name}`.trim()
      }
    }
  }

  if (channel === 'email') {
    const { data: clientContact } = await supabase
      .from('client_contacts')
      .select('client_id, first_name, last_name')
      .ilike('email', contact)
      .limit(1)
      .single()

    if (clientContact) {
      return {
        type: 'client',
        client_id: clientContact.client_id,
        name: `${clientContact.first_name} ${clientContact.last_name}`.trim()
      }
    }
  }

  // Check if it's an existing lead
  const { data: lead } = await supabase
    .from('unvrs_leads')
    .select('id, name, phone, email')
    .eq('user_id', ownerId)
    .or(`phone.ilike.%${contact}%,email.ilike.%${contact}%`)
    .limit(1)
    .single()

  if (lead) {
    return {
      type: 'lead',
      lead_id: lead.id,
      name: lead.name
    }
  }

  return { type: 'public' }
}

async function determineRouting(
  supabase: any,
  conversation: any,
  senderInfo: any,
  message: IncomingMessage
): Promise<{ agent: string, reason: string }> {
  
  // If sender is a known client → route to HLO (client support)
  if (senderInfo.type === 'client') {
    return { agent: 'hlo', reason: 'Known client - routing to HLO for support' }
  }

  // If sender is a lead → check current agent session
  if (senderInfo.type === 'lead') {
    // Check if there's an active session with another agent
    const { data: activeSession } = await supabase
      .from('unvrs_agent_sessions')
      .select('agent_type')
      .eq('conversation_id', conversation.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (activeSession && activeSession.agent_type !== 'brain') {
      return { 
        agent: activeSession.agent_type, 
        reason: `Continuing with ${activeSession.agent_type} session` 
      }
    }

    return { agent: 'switch', reason: 'Known lead - routing to SWITCH for qualification' }
  }

  // Public/unknown sender → route to SWITCH for initial qualification
  return { agent: 'switch', reason: 'Unknown sender - routing to SWITCH for qualification' }
}

async function getOrCreateAgentSession(
  supabase: any,
  ownerId: string,
  conversationId: string,
  agentType: string
) {
  // Check for existing active session
  const { data: existingSession } = await supabase
    .from('unvrs_agent_sessions')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('agent_type', agentType)
    .is('ended_at', null)
    .single()

  if (existingSession) {
    // Update last activity
    await supabase
      .from('unvrs_agent_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', existingSession.id)
    return existingSession
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from('unvrs_agent_sessions')
    .insert({
      user_id: ownerId,
      conversation_id: conversationId,
      agent_type: agentType,
      state: {},
      context: {}
    })
    .select()
    .single()

  if (error) {
    console.error('[UNVRS.BRAIN] Error creating session:', error)
    throw error
  }

  return newSession
}

async function transcribeVoice(
  supabase: any,
  ownerId: string,
  mediaUrl: string,
  audioMessageData?: any
): Promise<string> {
  // Get OpenAI API key
  const { data: openaiKey } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', ownerId)
    .eq('provider', 'openai')
    .single()

  if (!openaiKey) {
    console.log('[UNVRS.BRAIN] No OpenAI API key found, skipping transcription')
    return '[Voice message - transcription unavailable]'
  }

  const WASENDER_API_KEY = Deno.env.get('WASENDER_API_KEY')
  if (!WASENDER_API_KEY) {
    console.log('[UNVRS.BRAIN] No WASender API key found, skipping transcription')
    return '[Voice message - transcription unavailable]'
  }

  try {
    // If we have audioMessageData, use WASender decrypt-media API
    if (audioMessageData) {
      console.log('[UNVRS.BRAIN] Decrypting audio via WASender API...')
      
      // Build the decrypt request body
      const decryptBody = {
        data: {
          messages: {
            key: {
              id: audioMessageData.messageId || 'unknown'
            },
            message: {
              audioMessage: {
                url: audioMessageData.url,
                mimetype: audioMessageData.mimetype || 'audio/ogg; codecs=opus',
                mediaKey: audioMessageData.mediaKey,
                fileSha256: audioMessageData.fileSha256,
                fileLength: audioMessageData.fileLength,
                seconds: audioMessageData.seconds
              }
            }
          }
        }
      }

      console.log('[UNVRS.BRAIN] Decrypt request:', JSON.stringify(decryptBody))

      const decryptResponse = await fetch('https://www.wasenderapi.com/api/decrypt-media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WASENDER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(decryptBody)
      })

      if (!decryptResponse.ok) {
        const errorText = await decryptResponse.text()
        console.error('[UNVRS.BRAIN] WASender decrypt error:', decryptResponse.status, errorText)
        return '[Voice message - decrypt failed]'
      }

      const decryptResult = await decryptResponse.json()
      console.log('[UNVRS.BRAIN] Decrypt result:', JSON.stringify(decryptResult))

      if (!decryptResult.publicUrl) {
        console.error('[UNVRS.BRAIN] No publicUrl in decrypt response')
        return '[Voice message - decrypt failed]'
      }

      // Now download the decrypted audio
      console.log('[UNVRS.BRAIN] Downloading decrypted audio from:', decryptResult.publicUrl)
      
      const audioResponse = await fetch(decryptResult.publicUrl)
      if (!audioResponse.ok) {
        console.error('[UNVRS.BRAIN] Failed to download decrypted audio:', audioResponse.status)
        return '[Voice message - download failed]'
      }

      const audioBlob = await audioResponse.blob()
      console.log('[UNVRS.BRAIN] Decrypted audio blob size:', audioBlob.size, 'type:', audioBlob.type)

      // Send to OpenAI Whisper
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.ogg')
      formData.append('model', 'whisper-1')

      console.log('[UNVRS.BRAIN] Sending to OpenAI Whisper...')

      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey.api_key}`
        },
        body: formData
      })

      if (whisperResponse.ok) {
        const result = await whisperResponse.json()
        console.log('[UNVRS.BRAIN] Transcription result:', result.text)
        return result.text || '[Voice message - no text detected]'
      } else {
        const errorText = await whisperResponse.text()
        console.error('[UNVRS.BRAIN] OpenAI Whisper error:', whisperResponse.status, errorText)
        return '[Voice message - transcription failed]'
      }
    } else {
      // Fallback: try direct download (won't work for encrypted files)
      console.log('[UNVRS.BRAIN] No audioMessageData, trying direct download from:', mediaUrl)
      
      const audioResponse = await fetch(mediaUrl)
      if (!audioResponse.ok) {
        console.error('[UNVRS.BRAIN] Failed to download audio:', audioResponse.status)
        return '[Voice message - download failed]'
      }
      
      const audioBlob = await audioResponse.blob()
      console.log('[UNVRS.BRAIN] Audio blob size:', audioBlob.size, 'type:', audioBlob.type)

      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.ogg')
      formData.append('model', 'whisper-1')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey.api_key}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[UNVRS.BRAIN] Transcription result:', result.text)
        return result.text || '[Voice message - no text detected]'
      } else {
        const errorText = await response.text()
        console.error('[UNVRS.BRAIN] OpenAI Whisper error:', response.status, errorText)
        return '[Voice message - transcription failed]'
      }
    }
  } catch (error) {
    console.error('[UNVRS.BRAIN] Transcription error:', error)
    return '[Voice message - transcription error]'
  }
}

async function textToSpeech(
  supabase: any,
  ownerId: string,
  text: string
): Promise<string | undefined> {
  // Get ElevenLabs API key
  const { data: elevenLabsKey } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', ownerId)
    .eq('provider', 'elevenlabs')
    .single()

  if (!elevenLabsKey) {
    console.log('[UNVRS.BRAIN] No ElevenLabs API key found, skipping TTS')
    return undefined
  }

  try {
    // Use ElevenLabs TTS API
    // Voice ID: Laura (Italian) - FGY2WhTYpPnrIDTdsKH5
    const voiceId = 'FGY2WhTYpPnrIDTdsKH5'
    
    console.log('[UNVRS.BRAIN] Generating TTS for:', text.substring(0, 100))

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[UNVRS.BRAIN] ElevenLabs TTS error:', response.status, errorText)
      return undefined
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer()
    console.log('[UNVRS.BRAIN] TTS audio generated, size:', audioBuffer.byteLength)

    // Upload to Supabase Storage
    const fileName = `tts_${Date.now()}.mp3`
    const filePath = `voice-responses/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false
      })

    if (uploadError) {
      console.error('[UNVRS.BRAIN] Error uploading TTS audio:', uploadError)
      return undefined
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    console.log('[UNVRS.BRAIN] TTS audio uploaded:', publicUrlData.publicUrl)
    return publicUrlData.publicUrl

  } catch (error) {
    console.error('[UNVRS.BRAIN] TTS error:', error)
    return undefined
  }
}

async function generateAgentResponse(
  supabase: any,
  ownerId: string,
  conversation: any,
  session: any,
  routing: { agent: string, reason: string },
  senderInfo: any,
  content: string,
  originalMessage: IncomingMessage
): Promise<{ text?: string, action?: string }> {
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  
  // Route to appropriate agent edge function
  switch (routing.agent) {
    case 'hlo':
      try {
        const hloResponse = await fetch(`${supabaseUrl}/functions/v1/unvrs-hlo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            conversation_id: conversation.id,
            session_id: session.id,
            user_id: ownerId,
            message: content,
            sender_info: {
              type: 'client',
              client_id: senderInfo.client_id,
              name: senderInfo.name
            },
            channel: originalMessage.channel,
            contact_identifier: originalMessage.contact_identifier
          })
        })
        
        const hloResult = await hloResponse.json()
        console.log('[UNVRS.BRAIN] HLO response:', JSON.stringify(hloResult))
        
        return {
          text: hloResult.response,
          action: hloResult.action
        }
      } catch (error) {
        console.error('[UNVRS.BRAIN] HLO error:', error)
        return {
          text: `Ciao${senderInfo.name ? ` ${senderInfo.name}` : ''}! Ho ricevuto il tuo messaggio. Ti risponderemo a breve.`,
          action: 'queue_for_human'
        }
      }

    case 'switch':
      try {
        const switchResponse = await fetch(`${supabaseUrl}/functions/v1/unvrs-switch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            conversation_id: conversation.id,
            session_id: session.id,
            user_id: ownerId,
            message: content,
            sender_info: {
              type: senderInfo.type,
              lead_id: senderInfo.lead_id,
              name: senderInfo.name
            },
            channel: originalMessage.channel,
            contact_identifier: originalMessage.contact_identifier
          })
        })
        
        const switchResult = await switchResponse.json()
        console.log('[UNVRS.BRAIN] SWITCH response:', JSON.stringify(switchResult))
        
        // Handle handoffs
        if (switchResult.action === 'handoff_intake') {
          // Update conversation to INTAKE agent
          await supabase
            .from('unvrs_conversations')
            .update({ current_agent: 'intake' })
            .eq('id', conversation.id)
          
          // End SWITCH session
          await supabase
            .from('unvrs_agent_sessions')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', session.id)
        }
        
        return {
          text: switchResult.response,
          action: switchResult.action
        }
      } catch (error) {
        console.error('[UNVRS.BRAIN] SWITCH error:', error)
        return {
          text: `Ciao! Benvenuto in UNVRS Labs. 👋\nCome posso aiutarti oggi?`,
          action: 'await_response'
        }
      }

    case 'intake':
      // INTAKE agent will be implemented in Phase 2.5
      return {
        text: `Perfetto! Vediamo insieme di cosa hai bisogno. Puoi descrivermi brevemente il tuo progetto?`,
        action: 'collect_requirements'
      }

    default:
      return {
        text: `Messaggio ricevuto. Un operatore ti risponderà a breve.`,
        action: 'queue_for_human'
      }
  }
}
