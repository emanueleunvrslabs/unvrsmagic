import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: any
}

interface TelegramMessage {
  message_id: number
  from: {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
  }
  chat: {
    id: number
    first_name?: string
    last_name?: string
    username?: string
    type: 'private' | 'group' | 'supergroup' | 'channel'
  }
  date: number
  text?: string
  voice?: {
    file_id: string
    file_unique_id: string
    duration: number
    mime_type?: string
    file_size?: number
  }
  audio?: {
    file_id: string
    duration: number
    mime_type?: string
  }
  photo?: Array<{
    file_id: string
    file_unique_id: string
    width: number
    height: number
    file_size?: number
  }>
  video?: {
    file_id: string
    duration: number
    width: number
    height: number
  }
  document?: {
    file_id: string
    file_name?: string
    mime_type?: string
  }
  caption?: string
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

    const update: TelegramUpdate = await req.json()
    console.log('[TELEGRAM-WEBHOOK] Received update:', JSON.stringify(update))

    // Only process messages (not edits, callbacks, etc.)
    if (!update.message) {
      console.log('[TELEGRAM-WEBHOOK] No message in update, skipping')
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const message = update.message

    // Get owner user_id
    const { data: ownerRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'owner')
      .single()

    if (!ownerRole) {
      console.error('[TELEGRAM-WEBHOOK] No owner found')
      return new Response(JSON.stringify({ ok: false, error: 'No owner configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const ownerId = ownerRole.user_id

    // Get Telegram bot token from api_keys
    const { data: botToken } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', ownerId)
      .eq('provider', 'telegram')
      .single()

    if (!botToken) {
      console.error('[TELEGRAM-WEBHOOK] No Telegram bot token found')
      return new Response(JSON.stringify({ ok: false, error: 'Bot token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract message content
    const messageContent = await extractMessageContent(message, botToken.api_key)
    console.log('[TELEGRAM-WEBHOOK] Extracted content:', JSON.stringify(messageContent))

    // Build contact identifier (Telegram user ID)
    const contactIdentifier = message.from.id.toString()
    const contactName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ')

    // Forward to UNVRS.BRAIN
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const brainPayload = {
      channel: 'telegram',
      contact_identifier: contactIdentifier,
      contact_name: contactName,
      content_type: messageContent.type,
      content: messageContent.text,
      media_url: messageContent.mediaUrl,
      metadata: {
        telegram_message_id: message.message_id,
        telegram_chat_id: message.chat.id,
        telegram_username: message.from.username,
        telegram_language: message.from.language_code,
        raw_update: update
      }
    }

    console.log('[TELEGRAM-WEBHOOK] Sending to BRAIN:', JSON.stringify(brainPayload))

    const brainResponse = await fetch(`${supabaseUrl}/functions/v1/unvrs-brain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(brainPayload)
    })

    const brainResult = await brainResponse.json()
    console.log('[TELEGRAM-WEBHOOK] BRAIN response:', JSON.stringify(brainResult))

    // Send response back via Telegram
    if (brainResult.success && brainResult.response) {
      await sendTelegramMessage(botToken.api_key, message.chat.id, brainResult.response)
    }

    // Log activity
    await supabase.from('agent_logs').insert({
      agent_name: 'telegram-webhook',
      user_id: ownerId,
      log_level: 'info',
      message: `Processed Telegram message from ${contactName || contactIdentifier}`,
      action: 'receive_message',
      metadata: {
        telegram_user_id: message.from.id,
        telegram_username: message.from.username,
        content_type: messageContent.type,
        routed_to: brainResult.routed_to_agent,
        conversation_id: brainResult.conversation_id
      },
      duration_ms: Date.now() - startTime
    })

    return new Response(JSON.stringify({ ok: true, brain_response: brainResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[TELEGRAM-WEBHOOK] Error:', error)
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function extractMessageContent(
  message: TelegramMessage,
  botToken: string
): Promise<{ type: string; text?: string; mediaUrl?: string }> {
  
  // Text message
  if (message.text) {
    return { type: 'text', text: message.text }
  }

  // Voice message
  if (message.voice) {
    const mediaUrl = await getFileUrl(botToken, message.voice.file_id)
    return { type: 'voice', mediaUrl, text: message.caption }
  }

  // Audio message
  if (message.audio) {
    const mediaUrl = await getFileUrl(botToken, message.audio.file_id)
    return { type: 'voice', mediaUrl, text: message.caption }
  }

  // Photo
  if (message.photo && message.photo.length > 0) {
    // Get largest photo
    const largestPhoto = message.photo[message.photo.length - 1]
    const mediaUrl = await getFileUrl(botToken, largestPhoto.file_id)
    return { type: 'image', mediaUrl, text: message.caption }
  }

  // Video
  if (message.video) {
    const mediaUrl = await getFileUrl(botToken, message.video.file_id)
    return { type: 'video', mediaUrl, text: message.caption }
  }

  // Document
  if (message.document) {
    const mediaUrl = await getFileUrl(botToken, message.document.file_id)
    return { type: 'document', mediaUrl, text: message.caption }
  }

  return { type: 'unknown', text: '[Unsupported message type]' }
}

async function getFileUrl(botToken: string, fileId: string): Promise<string | undefined> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`)
    const result = await response.json()
    
    if (result.ok && result.result?.file_path) {
      return `https://api.telegram.org/file/bot${botToken}/${result.result.file_path}`
    }
  } catch (error) {
    console.error('[TELEGRAM-WEBHOOK] Error getting file URL:', error)
  }
  return undefined
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string
): Promise<void> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    })

    const result = await response.json()
    if (!result.ok) {
      console.error('[TELEGRAM-WEBHOOK] Failed to send message:', result)
    } else {
      console.log('[TELEGRAM-WEBHOOK] Message sent successfully')
    }
  } catch (error) {
    console.error('[TELEGRAM-WEBHOOK] Error sending message:', error)
  }
}
