import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { corsHeaders } from '../_shared/cors.ts';

interface SendDemoConfirmationRequest {
  bookingId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl) {
      console.error("SUPABASE_URL env variable is not set");
      throw new Error("SUPABASE_URL env variable is not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("Unauthorized");
    }

    const { bookingId }: SendDemoConfirmationRequest = await req.json();

    if (!bookingId) {
      throw new Error("bookingId is required");
    }

    console.log(`Processing demo confirmation for booking: ${bookingId}`);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("demo_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError);
      throw new Error("Booking not found");
    }

    console.log("Booking details:", booking);

    // Check if client has phone number
    if (!booking.client_phone) {
      console.log("No phone number for this booking, skipping WhatsApp");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No phone number available, confirmation not sent" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get WASender API key
    const wasenderApiKey = Deno.env.get('WASENDER_API_KEY');
    
    if (!wasenderApiKey) {
      throw new Error("WASender API key not configured");
    }

    // Format date and time
    const scheduledDate = new Date(booking.scheduled_at);
    const formattedDate = scheduledDate.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = scheduledDate.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Build confirmation message
    const projectName = booking.project_type 
      ? booking.project_type.charAt(0).toUpperCase() + booking.project_type.slice(1)
      : "il nostro software";

    let confirmationMessage = `✅ *Demo Confermata!*\n\n`;
    confirmationMessage += `Ciao ${booking.client_name || ""}! 👋\n\n`;
    confirmationMessage += `La tua demo per *${projectName}* è stata confermata.\n\n`;
    confirmationMessage += `📅 *Data:* ${formattedDate}\n`;
    confirmationMessage += `⏰ *Ora:* ${formattedTime}\n`;
    confirmationMessage += `⏱️ *Durata:* ${booking.duration_minutes} minuti\n`;
    
    if (booking.meeting_link) {
      confirmationMessage += `\n🔗 *Link meeting:*\n${booking.meeting_link}\n`;
    }
    
    confirmationMessage += `\nA presto! 🚀\n_UNVRS Labs_`;

    console.log(`Sending WhatsApp to ${booking.client_phone}`);

    // Send WhatsApp message via WASender API
    const wasenderResponse = await fetch("https://www.wasenderapi.com/api/send-message", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${wasenderApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: booking.client_phone,
        text: confirmationMessage,
      }),
    });

    if (!wasenderResponse.ok) {
      const errorText = await wasenderResponse.text();
      console.error("WASender API error:", errorText);
      throw new Error(`Failed to send WhatsApp message: ${errorText}`);
    }

    const wasenderData = await wasenderResponse.json();
    console.log("WASender response:", wasenderData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Confirmation sent via WhatsApp",
      messageId: wasenderData.message_id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-demo-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
