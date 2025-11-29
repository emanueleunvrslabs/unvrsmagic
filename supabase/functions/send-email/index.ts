import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  recipientName: string;
  subject: string;
  text: string;
  attachmentUrls?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get owner's Resend API key
    const { data: userData, error: userError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .single();

    if (userError || !userData) {
      throw new Error("Owner not found");
    }

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("user_id", userData.user_id)
      .eq("provider", "resend")
      .single();

    if (apiKeyError || !apiKeyData) {
      throw new Error("Resend API key not found");
    }

    const { to, recipientName, subject, text, attachmentUrls = [] }: SendEmailRequest = await req.json();

    // Fetch attachments and convert to base64
    const attachments = await Promise.all(
      attachmentUrls.map(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Extract filename from URL
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1] || 'attachment';
        
        return {
          filename,
          content: base64,
        };
      })
    );

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKeyData.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UNVRS LABS <noreply@unvrslabs.com>",
        to: [to],
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${recipientName},</h2>
            <p style="white-space: pre-wrap;">${text}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
              Best regards,<br/>
              UNVRS LABS Team
            </p>
          </div>
        `,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      throw new Error(errorData.message || "Failed to send email");
    }

    const resendData = await resendResponse.json();

    return new Response(JSON.stringify(resendData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
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
