import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, revolut-signature",
};

// Generate invoice email HTML
function generateInvoiceEmail(
  customerEmail: string,
  creditAmount: number,
  totalPaid: number,
  paymentId: string,
  purchaseDate: Date
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .total { font-size: 24px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Conferma Acquisto Credits</h1>
          <p>Grazie per il tuo acquisto!</p>
        </div>
        <div class="content">
          <div class="row">
            <span>Data:</span>
            <span>${purchaseDate.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</span>
          </div>
          <div class="row">
            <span>Credits Acquistati:</span>
            <span><strong>${creditAmount} credits</strong></span>
          </div>
          <div class="row">
            <span>ID Transazione:</span>
            <span style="font-family: monospace; font-size: 12px;">${paymentId}</span>
          </div>
          <div class="row">
            <span>Totale Pagato:</span>
            <span class="total">€${(totalPaid / 100).toFixed(2)}</span>
          </div>
        </div>
        <div class="footer">
          <p>UNVRS Labs - AI Content Generation Platform</p>
          <p>Questa è una ricevuta automatica. Non rispondere a questa email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log("Revolut webhook received:", event.event, event.order_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle ORDER_COMPLETED event
    if (event.event === "ORDER_COMPLETED") {
      const orderId = event.order_id;

      // Find the pending transaction with this order ID
      const { data: pendingTx, error: txError } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("metadata->>revolut_order_id", orderId)
        .eq("metadata->>status", "pending")
        .single();

      if (txError || !pendingTx) {
        console.error("Pending transaction not found for order:", orderId);
        return new Response(JSON.stringify({ error: "Transaction not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = pendingTx.user_id;
      const creditAmount = pendingTx.metadata?.credit_amount || 0;
      const totalPaid = event.amount || 0;

      console.log(`Processing payment for user ${userId}: ${creditAmount} credits`);

      // Add credits using the database function
      const { data: addResult, error: addError } = await supabase.rpc("add_credits", {
        p_user_id: userId,
        p_amount: creditAmount,
        p_stripe_payment_id: orderId, // Reusing this field for Revolut order ID
      });

      if (addError) {
        console.error("Error adding credits:", addError);
        throw addError;
      }

      // Update the pending transaction
      await supabase
        .from("credit_transactions")
        .update({
          amount: creditAmount,
          description: `${creditAmount} credits purchased`,
          metadata: {
            ...pendingTx.metadata,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
        })
        .eq("id", pendingTx.id);

      console.log("Credits added successfully:", creditAmount);

      // Get user email for invoice
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const customerEmail = userData?.user?.email;

      if (customerEmail) {
        // Send invoice email
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          try {
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: "UNVRS Labs <emanuele@unvrslabs.dev>",
              to: customerEmail,
              subject: `Conferma Acquisto - ${creditAmount} Credits`,
              html: generateInvoiceEmail(
                customerEmail,
                creditAmount,
                totalPaid,
                orderId,
                new Date()
              ),
            });
            console.log("Invoice email sent to:", customerEmail);
          } catch (emailError) {
            console.error("Error sending invoice email:", emailError);
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle ORDER_PAYMENT_FAILED event
    if (event.event === "ORDER_PAYMENT_FAILED") {
      const orderId = event.order_id;

      // Update the pending transaction to failed
      await supabase
        .from("credit_transactions")
        .update({
          description: "Payment failed",
          metadata: {
            status: "failed",
            failed_at: new Date().toISOString(),
            failure_reason: event.failure_reason,
          },
        })
        .match({ "metadata->>revolut_order_id": orderId });

      console.log("Payment failed for order:", orderId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For other events, just acknowledge
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Revolut webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
