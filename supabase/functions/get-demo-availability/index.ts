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

// Italian public holidays (fixed dates)
const FIXED_HOLIDAYS = [
  { month: 1, day: 1 },   // Capodanno
  { month: 1, day: 6 },   // Epifania
  { month: 4, day: 25 },  // Festa della Liberazione
  { month: 5, day: 1 },   // Festa dei Lavoratori
  { month: 6, day: 2 },   // Festa della Repubblica
  { month: 8, day: 15 },  // Ferragosto
  { month: 11, day: 1 },  // Ognissanti
  { month: 12, day: 8 },  // Immacolata Concezione
  { month: 12, day: 24 }, // Vigilia di Natale
  { month: 12, day: 25 }, // Natale
  { month: 12, day: 26 }, // Santo Stefano
  { month: 12, day: 31 }, // San Silvestro
]

// Calculate Easter Monday (Pasquetta) for a given year
const getEasterMonday = (year: number): Date => {
  // Anonymous Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  
  // Easter Monday is the day after Easter Sunday
  const easter = new Date(year, month - 1, day)
  easter.setDate(easter.getDate() + 1)
  return easter
}

// Check if a date is a public holiday
const isHoliday = (date: Date): boolean => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()
  
  // Check fixed holidays
  if (FIXED_HOLIDAYS.some(h => h.month === month && h.day === day)) {
    return true
  }
  
  // Check Easter Monday
  const easterMonday = getEasterMonday(year)
  if (date.getMonth() === easterMonday.getMonth() && 
      date.getDate() === easterMonday.getDate()) {
    return true
  }
  
  return false
}

// Business days: Monday = 1, Friday = 5, excluding holidays
const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay()
  return day >= 1 && day <= 5 && !isHoliday(date)
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
