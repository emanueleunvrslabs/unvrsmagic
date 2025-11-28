import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import JSZip from 'https://esm.sh/jszip@3.10.1?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadedFileRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  original_name: string;
  is_extracted: boolean;
  parent_zip_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')!
        }
      }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    const uploadedFiles: UploadedFileRecord[] = [];
    const isZipFile = file.name.toLowerCase().endsWith('.zip') || 
                      file.type === 'application/zip' ||
                      file.type === 'application/x-zip-compressed';

    if (isZipFile) {
      console.log('Processing ZIP file...');
      
      try {
        // Read ZIP file
        const arrayBuffer = await file.arrayBuffer();
        const zipData = new Uint8Array(arrayBuffer);
        
        // Upload the original ZIP file first
        const zipFileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data: zipUploadData, error: zipUploadError } = await supabase.storage
          .from('uploads')
          .upload(zipFileName, zipData, {
            contentType: 'application/zip',
            cacheControl: '3600',
            upsert: false,
          });

        if (zipUploadError) {
          console.error('Error uploading ZIP:', zipUploadError);
          throw zipUploadError;
        }

        console.log('ZIP uploaded:', zipUploadData.path);

        // Save ZIP metadata to database
        const { data: zipRecord, error: zipDbError } = await supabase
          .from('uploaded_files')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || 'application/zip',
            file_path: zipUploadData.path,
            original_name: file.name,
            is_extracted: true,
            metadata: {
              is_zip: true,
              upload_timestamp: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (zipDbError) {
          console.error('Error saving ZIP to database:', zipDbError);
          throw zipDbError;
        }

        console.log('ZIP saved to database:', zipRecord.id);
        uploadedFiles.push(zipRecord);

        // Extract ZIP contents using JSZip
        const zip = new JSZip();
        await zip.loadAsync(arrayBuffer);
        
        console.log('ZIP loaded, extracting files...');
        
        let extractedCount = 0;
        
        // Process each file in the ZIP
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) {
            console.log('Skipping directory:', relativePath);
            continue;
          }

          try {
            console.log('Extracting file:', relativePath);
            
            // Get file content as Uint8Array
            const fileContent = await zipEntry.async('uint8array');
            
            // Determine file type from extension
            const fileName = relativePath.split('/').pop() || relativePath;
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const mimeTypes: Record<string, string> = {
              'txt': 'text/plain',
              'pdf': 'application/pdf',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'png': 'image/png',
              'gif': 'image/gif',
              'doc': 'application/msword',
              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'xls': 'application/vnd.ms-excel',
              'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'csv': 'text/csv',
              'json': 'application/json',
              'xml': 'application/xml',
            };
            const fileType = mimeTypes[ext] || 'application/octet-stream';
            
            // Upload extracted file to storage
            const extractedFileName = `${user.id}/${Date.now()}-${extractedCount}-${fileName}`;
            const { data: extractedUploadData, error: extractedUploadError } = await supabase.storage
              .from('uploads')
              .upload(extractedFileName, fileContent, {
                contentType: fileType,
                cacheControl: '3600',
                upsert: false,
              });

            if (extractedUploadError) {
              console.error('Error uploading extracted file:', extractedUploadError);
              continue;
            }

            console.log('Extracted file uploaded:', extractedUploadData.path);

            // Save extracted file metadata to database
            const { data: extractedRecord, error: extractedDbError } = await supabase
              .from('uploaded_files')
              .insert({
                user_id: user.id,
                file_name: fileName,
                file_size: fileContent.length,
                file_type: fileType,
                file_path: extractedUploadData.path,
                original_name: relativePath,
                is_extracted: false,
                parent_zip_id: zipRecord.id,
                metadata: {
                  extracted_from_zip: true,
                  relative_path: relativePath,
                  extraction_timestamp: new Date().toISOString()
                }
              })
              .select()
              .single();

            if (extractedDbError) {
              console.error('Error saving extracted file to database:', extractedDbError);
              continue;
            }

            console.log('Extracted file saved to database:', extractedRecord.id);
            uploadedFiles.push(extractedRecord);
            extractedCount++;
            
          } catch (fileError) {
            console.error(`Error processing file ${relativePath}:`, fileError);
            continue;
          }
        }
        
        console.log(`Successfully extracted ${extractedCount} files from ZIP`);
        
      } catch (zipError) {
        console.error('Error processing ZIP file:', zipError);
        throw zipError;
      }
    } else {
      // Upload regular file
      console.log('Uploading regular file...');
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const fileData = await file.arrayBuffer();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, fileData, {
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded:', uploadData.path);

      // Save file metadata to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          file_path: uploadData.path,
          original_name: file.name,
          is_extracted: false,
          metadata: {
            is_zip: false,
            upload_timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving file to database:', dbError);
        throw dbError;
      }

      console.log('File saved to database:', fileRecord.id);
      uploadedFiles.push(fileRecord);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        files: uploadedFiles,
        message: isZipFile 
          ? `ZIP file extracted successfully! ${uploadedFiles.length - 1} files extracted and saved.`
          : 'File uploaded successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
