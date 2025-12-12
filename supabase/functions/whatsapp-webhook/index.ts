import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { timingSafeEqual } from "https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature using timing-safe comparison
    const signature = req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('WASENDER_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      console.error('[WhatsApp Webhook] Missing signature or secret');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to Uint8Array for timing-safe comparison
    const sigBuffer = new TextEncoder().encode(signature);
    const secretBuffer = new TextEncoder().encode(webhookSecret);
    
    // Length check and timing-safe comparison
    if (sigBuffer.length !== secretBuffer.length || !timingSafeEqual(sigBuffer, secretBuffer)) {
      console.error('[WhatsApp Webhook] Signature mismatch');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[WhatsApp Webhook] Payload received:', JSON.stringify(payload));

    // Process incoming messages - WASender uses "messages.received" event
    if (payload.event === 'messages.received') {
      const messageData = payload.data?.messages || {};
      
      // Use senderPn (actual phone number) if available, otherwise fall back to remoteJid
      // senderPn contains the real phone number like "447853751579@s.whatsapp.net"
      // remoteJid can be a LID (LinkedIn ID) like "215479281016833@lid" which doesn't match client contacts
      const senderPn = messageData.key?.senderPn || messageData.key?.cleanedSenderPn;
      const remoteJid = messageData.key?.remoteJid || messageData.remoteJid;
      const from = senderPn || remoteJid;
      
      const pushName = messageData.pushName || payload.data?.pushName;
      
      // Determine message content type and extract content
      const messageContent = extractMessageContent(messageData);
      
      console.log('[WhatsApp Webhook] Processing message from:', from, 'senderPn:', senderPn, 'remoteJid:', remoteJid, 'type:', messageContent.type);
      
      if (from) {
        // Normalize phone number - remove WhatsApp suffixes
        const normalizedPhone = from.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '');
        
        // Forward to UNVRS.BRAIN for intelligent routing
        const brainPayload = {
          channel: 'whatsapp',
          contact_identifier: normalizedPhone,
          contact_name: pushName,
          content_type: messageContent.type,
          content: messageContent.text,
          media_url: messageContent.mediaUrl,
          audio_message_data: messageContent.audioMessageData,
          metadata: {
            wasender_message_id: messageData.key?.id,
            wasender_timestamp: messageData.messageTimestamp,
            raw_payload: payload
          }
        };

        console.log('[WhatsApp Webhook] Forwarding to UNVRS.BRAIN:', JSON.stringify(brainPayload));

        // Call UNVRS.BRAIN edge function
        const brainResponse = await fetch(`${supabaseUrl}/functions/v1/unvrs-brain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify(brainPayload)
        });

        const brainResult = await brainResponse.json();
        console.log('[WhatsApp Webhook] UNVRS.BRAIN response:', JSON.stringify(brainResult));

        // If BRAIN generated a response, send it back via WhatsApp
        if (brainResult.success && brainResult.response) {
          // For voice messages, we MUST reply with voice only
          if (messageContent.type === 'voice') {
            if (brainResult.response_type === 'audio' && brainResult.audio_url) {
              await sendWhatsAppAudio(normalizedPhone, brainResult.audio_url);
            } else {
              console.warn('[WhatsApp Webhook] Voice message received but no audio_url in BRAIN response, skipping text reply');
            }
          } else {
            // For text (and other non-voice) messages, reply with text only
            await sendWhatsAppResponse(supabase, normalizedPhone, brainResult.response);
          }
        }

        // Also maintain backward compatibility - store in whatsapp_messages if it's an existing client
        await storeMessageForLegacySystem(supabase, normalizedPhone, messageContent.text || '[Media message]');
      }
    }

    // Handle message status updates
    if (payload.event === 'messages.update' || payload.event === 'message.status') {
      console.log('[WhatsApp Webhook] Status update received:', JSON.stringify(payload));
      // Status updates can be processed here if needed
    }

    return new Response(
      JSON.stringify({ success: true, received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Extract message content based on message type
function extractMessageContent(messageData: any): { 
  type: 'text' | 'voice' | 'image' | 'document' | 'video', 
  text?: string, 
  mediaUrl?: string,
  audioMessageData?: {
    url: string
    mimetype?: string
    mediaKey: string
    fileSha256?: string
    fileLength?: string
    seconds?: number
    messageId?: string
  }
} {
  const message = messageData.message || {};
  const messageId = messageData.key?.id;
  
  // Text message
  if (message.conversation) {
    return { type: 'text', text: message.conversation };
  }
  
  // Extended text message (with links, etc.)
  if (message.extendedTextMessage?.text) {
    return { type: 'text', text: message.extendedTextMessage.text };
  }
  
  // Voice/Audio message - include all data needed for decryption
  if (message.audioMessage) {
    return { 
      type: 'voice', 
      mediaUrl: message.audioMessage.url,
      text: message.audioMessage.caption,
      audioMessageData: {
        url: message.audioMessage.url,
        mimetype: message.audioMessage.mimetype,
        mediaKey: message.audioMessage.mediaKey,
        fileSha256: message.audioMessage.fileSha256,
        fileLength: message.audioMessage.fileLength,
        seconds: message.audioMessage.seconds,
        messageId: messageId
      }
    };
  }
  
  // Image message
  if (message.imageMessage) {
    return { 
      type: 'image', 
      mediaUrl: message.imageMessage.url,
      text: message.imageMessage.caption
    };
  }
  
  // Video message
  if (message.videoMessage) {
    return { 
      type: 'video', 
      mediaUrl: message.videoMessage.url,
      text: message.videoMessage.caption
    };
  }
  
  // Document message
  if (message.documentMessage) {
    return { 
      type: 'document', 
      mediaUrl: message.documentMessage.url,
      text: message.documentMessage.fileName
    };
  }
  
  // Fallback to messageBody if available
  if (messageData.messageBody) {
    return { type: 'text', text: messageData.messageBody };
  }
  
  return { type: 'text', text: '[Unsupported message type]' };
}

// Send response back via WhatsApp using WASender
async function sendWhatsAppResponse(supabase: any, phone: string, text: string) {
  try {
    // Get WASender API key from environment (same as OTP function)
    const wasenderApiKey = Deno.env.get('WASENDER_API_KEY');

    if (!wasenderApiKey) {
      console.log('[WhatsApp Webhook] No WASender API key configured in environment');
      return;
    }

    // Format phone number for WASender
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // Send message via WASender API (same endpoint as OTP function)
    const response = await fetch('https://www.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wasenderApiKey}`
      },
      body: JSON.stringify({
        to: formattedPhone,
        text: text
      })
    });

    const result = await response.json();
    console.log('[WhatsApp Webhook] WASender send result:', JSON.stringify(result));

  } catch (error) {
    console.error('[WhatsApp Webhook] Error sending response:', error);
  }
}

// Send audio response via WhatsApp using WASender (voice note via audioUrl)
async function sendWhatsAppAudio(phone: string, audioUrl: string) {
  try {
    const wasenderApiKey = Deno.env.get('WASENDER_API_KEY');

    if (!wasenderApiKey) {
      console.log('[WhatsApp Webhook] No WASender API key configured for audio');
      return;
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // According to Wasender API docs, audio is sent via /api/send-message with audioUrl
    const response = await fetch('https://www.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wasenderApiKey}`,
      },
      body: JSON.stringify({
        to: formattedPhone,
        audioUrl,
      }),
    });

    const result = await response.json();
    console.log('[WhatsApp Webhook] WASender audio send result:', JSON.stringify(result));
  } catch (error) {
    console.error('[WhatsApp Webhook] Error sending audio response:', error);
  }
}

// Maintain backward compatibility with existing whatsapp_messages table
async function storeMessageForLegacySystem(supabase: any, phone: string, text: string) {
  try {
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    
    // Find the contact by phone number
    const { data: contact } = await supabase
      .from('client_contacts')
      .select('id, client_id, whatsapp_number')
      .or(`whatsapp_number.eq.${phoneWithPlus},whatsapp_number.eq.${phone}`)
      .single();

    if (contact) {
      // Get owner user_id
      const { data: ownerRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'owner')
        .single();

      // Save incoming message to legacy database
      await supabase
        .from('whatsapp_messages')
        .insert({
          client_id: contact.client_id,
          contact_id: contact.id,
          phone_number: contact.whatsapp_number,
          message_text: text,
          direction: 'incoming',
          status: 'received',
          user_id: ownerRole?.user_id
        });

      console.log('[WhatsApp Webhook] Message stored in legacy system for contact:', contact.id);
    }
  } catch (error) {
    console.error('[WhatsApp Webhook] Error storing legacy message:', error);
  }
}
