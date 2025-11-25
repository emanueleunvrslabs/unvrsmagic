import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as zip from "https://deno.land/x/zipjs@v2.7.34/index.js";

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

    const { storageFilePath } = await req.json();

    if (!storageFilePath) {
      throw new Error("Missing storage file path");
    }

    console.log("Extracting ZIP file from storage:", storageFilePath);

    // Download the ZIP file from storage
    const { data: zipData, error: downloadError } = await supabaseClient.storage
      .from("dispatch-files")
      .download(storageFilePath);

    if (downloadError || !zipData) {
      throw new Error(`Failed to download ZIP file: ${downloadError?.message}`);
    }

    const extractedFiles: { fileName: string; fileSize: number; filePath: string }[] = [];

    // Recursively extract all ZIP files
    await extractZipRecursive(zipData, user.id, supabaseClient, extractedFiles, storageFilePath);

    console.log(`Successfully extracted ${extractedFiles.length} files from ZIP`);

    return new Response(
      JSON.stringify({ success: true, extractedFiles, totalFiles: extractedFiles.length }),
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

async function extractZipRecursive(
  zipBlob: Blob,
  userId: string,
  supabaseClient: any,
  extractedFiles: { fileName: string; fileSize: number; filePath: string }[],
  parentPath: string
): Promise<void> {
  const zipReader = new zip.ZipReader(new zip.BlobReader(zipBlob));
  const entries = await zipReader.getEntries();

  console.log(`Found ${entries.length} entries in ZIP`);

  for (const entry of entries) {
    if (entry.directory || !entry.getData) {
      continue;
    }

    console.log(`Processing entry: ${entry.filename}`);

    const writer = new zip.BlobWriter();
    const fileBlob = await entry.getData(writer);
    const fileName = entry.filename.split('/').pop() || entry.filename;

    // Check if this is another ZIP file
    if (fileName.toLowerCase().endsWith('.zip')) {
      console.log(`Found nested ZIP: ${fileName}, extracting recursively...`);
      await extractZipRecursive(fileBlob, userId, supabaseClient, extractedFiles, `${parentPath}/${fileName}`);
    } else if (
      fileName.toLowerCase().endsWith('.csv') ||
      fileName.toLowerCase().endsWith('.xml') ||
      fileName.toLowerCase().endsWith('.xlsx')
    ) {
      // This is a data file, upload it
      const timestamp = Date.now();
      const filePath = `${userId}/letture/extracted/${timestamp}_${fileName}`;
      
      console.log(`Uploading extracted file: ${fileName} (${fileBlob.size} bytes)`);

      const { error: uploadError } = await supabaseClient.storage
        .from("dispatch-files")
        .upload(filePath, fileBlob);

      if (uploadError) {
        console.error(`Failed to upload ${fileName}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabaseClient.storage
        .from("dispatch-files")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabaseClient
        .from("dispatch_files")
        .insert({
          user_id: userId,
          file_type: "LETTURE",
          file_name: fileName,
          file_url: publicUrl,
          file_size: fileBlob.size,
          upload_source: "extracted",
          status: "uploaded",
          metadata: { 
            extracted_from: parentPath,
            original_path: entry.filename 
          },
        });

      if (dbError) {
        console.error(`Failed to insert ${fileName} to database:`, dbError);
        continue;
      }

      extractedFiles.push({
        fileName,
        fileSize: fileBlob.size,
        filePath,
      });

      console.log(`Successfully processed: ${fileName}`);
    }
  }

  await zipReader.close();
}
