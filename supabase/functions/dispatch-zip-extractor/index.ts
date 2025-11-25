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

    const { storageFilePath, fileName, fileSize } = await req.json();

    if (!storageFilePath) {
      throw new Error("Missing storage file path");
    }

    console.log("Registering ZIP file:", storageFilePath);

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabaseClient.storage
      .from("dispatch-files")
      .getPublicUrl(storageFilePath);

    // Register the ZIP file in the database for later processing by the orchestrator
    const { error: dbError } = await supabaseClient
      .from("dispatch_files")
      .insert({
        user_id: user.id,
        file_type: "LETTURE_ZIP",
        file_name: fileName || storageFilePath.split('/').pop(),
        file_url: publicUrl,
        file_size: fileSize || 0,
        upload_source: "direct",
        status: "pending_extraction",
        metadata: { 
          original_path: storageFilePath,
          requires_extraction: true
        },
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      throw dbError;
    }

    console.log("ZIP file registered successfully for later processing");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "File registrato. L'estrazione avverrà durante l'elaborazione.",
        fileName: fileName || storageFilePath.split('/').pop()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in dispatch-zip-extractor:", error);
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
