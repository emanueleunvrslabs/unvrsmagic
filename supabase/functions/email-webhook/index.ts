import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

// Verify Resend webhook signature (Svix)
async function verifyWebhookSignature(
  payload: string,
  headers: Headers
): Promise<boolean> {
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("RESEND_WEBHOOK_SECRET not configured, skipping verification");
    return true;
  }

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing Svix headers");
    return false;
  }

  // Check timestamp is recent (within 5 minutes)
  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error("Webhook timestamp too old");
    return false;
  }

  // Construct signed payload
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;

  // Decode secret (remove "whsec_" prefix if present)
  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Uint8Array.from(atob(secretKey), c => c.charCodeAt(0));

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // Svix sends multiple signatures, check if any match
  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const [version, signature] = sig.split(",");
    if (version === "v1" && signature === expectedSignature) {
      return true;
    }
  }

  console.error("Webhook signature mismatch");
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, req.headers);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse incoming email from Resend inbound webhook
    const payload = JSON.parse(rawBody);
    console.log("Received email webhook payload:", JSON.stringify(payload));

    // Resend sends events wrapped in a data object
    const emailData = payload.data || payload;
    const {
      from,
      to,
      subject,
      text,
      html,
      attachments = []
    } = emailData;

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
      .ilike("email", senderEmail)
      .single();

    if (!contactData) {
      console.log(`No client contact found for email: ${senderEmail}`);
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
        if (attachment.content) {
          const fileName = `${Date.now()}-${attachment.filename || 'attachment'}`;
          const filePath = `received/${fileName}`;
          
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
