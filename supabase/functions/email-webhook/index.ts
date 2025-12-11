import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse incoming email from Resend inbound webhook
    const payload = await req.json();
    console.log("Received email webhook payload:", JSON.stringify(payload));

    const {
      from,
      to,
      subject,
      text,
      html,
      attachments = []
    } = payload;

    // Extract sender email
    const senderEmail = from?.match(/<(.+?)>/)?.[1] || from || "";
    const recipientEmail = Array.isArray(to) ? to[0] : to;

    console.log(`Email from: ${senderEmail} to: ${recipientEmail}`);

    // Get owner user_id
    const { data: ownerData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .single();

    if (!ownerData) {
      throw new Error("Owner not found");
    }

    // Find client contact by sender email
    const { data: contactData } = await supabase
      .from("client_contacts")
      .select("id, client_id, first_name, last_name")
      .eq("email", senderEmail)
      .single();

    if (!contactData) {
      console.log(`No client contact found for email: ${senderEmail}`);
      // Still store the email but without client association
      // You could create a generic inbox for unknown senders
      return new Response(
        JSON.stringify({ message: "Email received but no matching client contact found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found contact: ${contactData.first_name} ${contactData.last_name} for client ${contactData.client_id}`);

    // Process attachments - store in Supabase Storage
    const storedAttachments: string[] = [];
    for (const attachment of attachments) {
      try {
        // Resend sends attachments as base64
        if (attachment.content) {
          const fileName = `${Date.now()}-${attachment.filename || 'attachment'}`;
          const filePath = `email-attachments/${fileName}`;
          
          // Decode base64
          const binaryString = atob(attachment.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const { error: uploadError } = await supabase.storage
            .from("email-attachments")
            .upload(filePath, bytes, {
              contentType: attachment.contentType || 'application/octet-stream'
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("email-attachments")
              .getPublicUrl(filePath);
            storedAttachments.push(publicUrl);
          }
        }
      } catch (attachError) {
        console.error("Error processing attachment:", attachError);
      }
    }

    // Store email in database
    const { error: insertError } = await supabase
      .from("client_emails")
      .insert({
        client_id: contactData.client_id,
        contact_id: contactData.id,
        user_id: ownerData.user_id,
        direction: "received",
        subject: subject || "(No subject)",
        body: text || html || "",
        sender_email: senderEmail,
        recipient_email: recipientEmail || "emanuele@unvrslabs.dev",
        status: "received",
        attachments: storedAttachments
      });

    if (insertError) {
      console.error("Error inserting email:", insertError);
      throw insertError;
    }

    console.log("Email stored successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Email received and stored" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in email-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
