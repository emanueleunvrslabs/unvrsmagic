import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendInvoiceEmail(
  resendApiKey: string,
  customerEmail: string,
  customerName: string,
  creditAmount: number,
  totalPaid: number,
  paymentId: string,
  purchaseDate: Date
) {
  const resend = new Resend(resendApiKey);
  
  const formattedDate = purchaseDate.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const emailResponse = await resend.emails.send({
    from: "UNVRS Magic AI <noreply@unvrslabs.dev>",
    to: [customerEmail],
    subject: `Ricevuta acquisto crediti - ${creditAmount} crediti`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .row:last-child { border-bottom: none; font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">UNVRS Magic AI</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Ricevuta di pagamento</p>
          </div>
          <div class="content">
            <p>Ciao <strong>${customerName || "Cliente"}</strong>,</p>
            <p>Grazie per il tuo acquisto! Ecco il riepilogo della transazione:</p>
            
            <div class="invoice-box">
              <div class="row">
                <span>Data acquisto:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="row">
                <span>ID Transazione:</span>
                <span style="font-family: monospace; font-size: 12px;">${paymentId}</span>
              </div>
              <div class="row">
                <span>Crediti acquistati:</span>
                <span>${creditAmount} crediti</span>
              </div>
              <div class="row">
                <span>Totale pagato:</span>
                <span>€${(totalPaid / 100).toFixed(2)}</span>
              </div>
            </div>
            
            <p>I crediti sono stati aggiunti al tuo account e sono già disponibili per l'utilizzo.</p>
            
            <p>Per qualsiasi domanda o assistenza, non esitare a contattarci.</p>
            
            <div class="footer">
              <p>Questa è una ricevuta automatica generata da UNVRS Magic AI.</p>
              <p>© ${new Date().getFullYear()} UNVRS Magic AI. Tutti i diritti riservati.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return emailResponse;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Webhook signature verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
    }

    console.log("Stripe webhook event:", event.type);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.user_id;
      const creditAmount = parseFloat(session.metadata?.credit_amount || "0");
      const paymentId = session.payment_intent as string;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const customerName = session.customer_details?.name || "";
      const totalPaid = session.amount_total || 0;

      if (!userId || !creditAmount) {
        console.error("Missing metadata:", session.metadata);
        throw new Error("Missing user_id or credit_amount in metadata");
      }

      console.log(`Adding ${creditAmount} credits for user ${userId}`);

      // Add credits using the database function
      const { data, error } = await supabase.rpc("add_credits", {
        p_user_id: userId,
        p_amount: creditAmount,
        p_stripe_payment_id: paymentId,
      });

      if (error) {
        console.error("Error adding credits:", error);
        throw error;
      }

      console.log("Credits added successfully");

      // Send invoice email if customer email is available
      if (customerEmail) {
        try {
          // Get Resend API key from api_keys table (from owner)
          const { data: ownerRole } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "owner")
            .single();

          if (ownerRole) {
            const { data: resendKey } = await supabase
              .from("api_keys")
              .select("api_key")
              .eq("user_id", ownerRole.user_id)
              .eq("provider", "resend")
              .single();

            if (resendKey?.api_key) {
              await sendInvoiceEmail(
                resendKey.api_key,
                customerEmail,
                customerName,
                creditAmount,
                totalPaid,
                paymentId,
                new Date()
              );
              console.log("Invoice email sent successfully to:", customerEmail);
            } else {
              console.log("No Resend API key configured, skipping email");
            }
          }
        } catch (emailError) {
          console.error("Error sending invoice email:", emailError);
          // Don't throw - credits were added, email is secondary
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
