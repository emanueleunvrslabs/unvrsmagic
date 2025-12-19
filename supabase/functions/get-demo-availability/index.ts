import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Available time slots (30 min intervals)
const AVAILABLE_SLOTS = {
  morning: ['11:00', '11:30', '12:00', '12:30'],
  afternoon: ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
}

// Business days: Monday = 1, Friday = 5
const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

// Get next N business days starting from tomorrow
const getNextBusinessDays = (count: number): Date[] => {
  const days: Date[] = []
  const today = new Date()
  let current = new Date(today)
  current.setDate(current.getDate() + 1) // Start from tomorrow
  
  while (days.length < count) {
    if (isBusinessDay(current)) {
      days.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

// Format date for display in Italian
const formatDateIT = (date: Date): string => {
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
  
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
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

    const { user_id, days_ahead = 7 } = await req.json()
    
    console.log('[get-demo-availability] Checking availability for user:', user_id)

    // Get next business days
    const businessDays = getNextBusinessDays(Math.min(days_ahead, 14))
    
    // Get all scheduled bookings in this range
    const startDate = businessDays[0]
    const endDate = businessDays[businessDays.length - 1]
    endDate.setHours(23, 59, 59, 999)

    const { data: existingBookings, error } = await supabase
      .from('demo_bookings')
      .select('scheduled_at, duration_minutes, status')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .in('status', ['scheduled', 'pending_approval'])

    if (error) {
      console.error('[get-demo-availability] Error fetching bookings:', error)
      throw error
    }

    // Build availability map
    const bookedSlots = new Set(
      (existingBookings || []).map(b => {
        const date = new Date(b.scheduled_at)
        return `${date.toISOString().split('T')[0]}_${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      })
    )

    // Generate available slots for each day
    const availability: Array<{
      date: string
      date_formatted: string
      slots: Array<{ time: string, available: boolean }>
    }> = []

    for (const day of businessDays) {
      const dateStr = day.toISOString().split('T')[0]
      const allSlots = [...AVAILABLE_SLOTS.morning, ...AVAILABLE_SLOTS.afternoon]
      
      const slots = allSlots.map(time => ({
        time,
        available: !bookedSlots.has(`${dateStr}_${time}`)
      }))

      const availableSlots = slots.filter(s => s.available)
      
      if (availableSlots.length > 0) {
        availability.push({
          date: dateStr,
          date_formatted: formatDateIT(day),
          slots: availableSlots
        })
      }
    }

    // Pick top 3 suggestions (first available slot per day)
    const suggestions = availability
      .slice(0, 3)
      .map(day => ({
        date: day.date,
        date_formatted: day.date_formatted,
        time: day.slots[0].time
      }))

    console.log('[get-demo-availability] Found', suggestions.length, 'slot suggestions')

    return new Response(JSON.stringify({
      success: true,
      availability,
      suggestions,
      business_hours: {
        morning: '11:00 - 13:00',
        afternoon: '15:00 - 18:00',
        days: 'Lunedì - Venerdì'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[get-demo-availability] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
