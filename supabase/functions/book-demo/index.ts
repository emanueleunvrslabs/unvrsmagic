import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookDemoRequest {
  user_id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  client_name: string
  client_phone?: string
  client_email?: string
  project_type: string
  conversation_id?: string
  lead_id?: string
}

// Validate time slot
const isValidSlot = (time: string): boolean => {
  const validSlots = ['11:00', '11:30', '12:00', '12:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
  return validSlots.includes(time)
}

// Validate date is a business day
const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

// Validate date is in the future
const isFutureDate = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const request: BookDemoRequest = await req.json()
    console.log('[book-demo] Booking request:', JSON.stringify(request))

    // Validate required fields
    if (!request.user_id || !request.date || !request.time || !request.client_name || !request.project_type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: user_id, date, time, client_name, project_type'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate time slot
    if (!isValidSlot(request.time)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid time slot. Available slots: 11:00-13:00 and 15:00-18:00 (30 min intervals)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse and validate date
    const scheduledDate = new Date(`${request.date}T${request.time}:00`)
    
    if (isNaN(scheduledDate.getTime())) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!isFutureDate(scheduledDate)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Date must be in the future'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!isBusinessDay(scheduledDate)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Date must be a business day (Monday-Friday)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if slot is already booked
    const startOfSlot = new Date(scheduledDate)
    const endOfSlot = new Date(scheduledDate)
    endOfSlot.setMinutes(endOfSlot.getMinutes() + 30)

    const { data: existingBookings } = await supabase
      .from('demo_bookings')
      .select('id')
      .gte('scheduled_at', startOfSlot.toISOString())
      .lt('scheduled_at', endOfSlot.toISOString())
      .in('status', ['scheduled', 'pending_approval'])
      .limit(1)

    if (existingBookings && existingBookings.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This time slot is already booked. Please choose another time.'
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create the booking with pending_approval status
    const projectLabel = request.project_type.charAt(0).toUpperCase() + request.project_type.slice(1)
    const title = `Demo ${projectLabel} - ${request.client_name}`

    const { data: booking, error: insertError } = await supabase
      .from('demo_bookings')
      .insert({
        user_id: request.user_id,
        title,
        client_name: request.client_name,
        client_phone: request.client_phone || null,
        client_email: request.client_email || null,
        project_type: request.project_type,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes: 30,
        status: 'pending_approval',
        notes: request.conversation_id ? `From conversation: ${request.conversation_id}` : null
      })
      .select()
      .single()

    if (insertError) {
      console.error('[book-demo] Insert error:', insertError)
      throw insertError
    }

    console.log('[book-demo] Booking created with pending_approval:', booking.id)

    // If there's a lead_id, update the lead status
    if (request.lead_id) {
      await supabase
        .from('unvrs_leads')
        .update({
          status: 'qualified',
          qualified_at: new Date().toISOString(),
          metadata: { demo_booking_id: booking.id }
        })
        .eq('id', request.lead_id)
    }

    // Format confirmation message
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    const dateFormatted = `${days[scheduledDate.getDay()]} ${scheduledDate.getDate()}/${scheduledDate.getMonth() + 1}`

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        title: booking.title,
        date: request.date,
        time: request.time,
        date_formatted: dateFormatted,
        status: 'pending_approval'
      },
      message: `Richiesta demo ricevuta per\n\n${dateFormatted} alle ${request.time}.\n\nTi confermeremo a breve!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[book-demo] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
