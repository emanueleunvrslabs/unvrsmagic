import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid user");
    }

    const { fileUrl, zoneCode, fileType, monthReference } = await req.json();

    if (!fileUrl || !zoneCode || !fileType || !monthReference) {
      throw new Error("Missing required fields");
    }

    console.log("Downloading file from URL:", fileUrl);

    // Download file from URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const fileBlob = await response.blob();
    const fileName = `${fileType}_${zoneCode}_${monthReference}_${Date.now()}.${fileUrl.split('.').pop() || 'csv'}`;
    
    console.log(`Downloaded file: ${fileName}, size: ${fileBlob.size} bytes`);

    // Upload to storage
    const filePath = `${user.id}/${zoneCode}/${fileType}/${monthReference}/${fileName}`;
    const { error: uploadError } = await supabaseClient.storage
      .from("dispatch-files")
      .upload(filePath, fileBlob);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from("dispatch-files")
      .getPublicUrl(filePath);

    // Save file metadata
    const { error: dbError } = await supabaseClient
      .from("dispatch_files")
      .insert({
        user_id: user.id,
        zone_code: zoneCode,
        file_type: fileType,
        file_name: fileName,
        file_url: publicUrl,
        file_size: fileBlob.size,
        upload_source: "url",
        month_reference: monthReference,
        status: "uploaded",
        metadata: { original_url: fileUrl },
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      throw dbError;
    }

    console.log("File successfully processed and stored");

    return new Response(
      JSON.stringify({ success: true, fileName, fileSize: fileBlob.size }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in dispatch-file-downloader:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
