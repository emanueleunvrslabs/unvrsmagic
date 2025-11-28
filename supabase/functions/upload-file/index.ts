import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { decompress } from 'https://deno.land/x/zip@v1.2.5/mod.ts';

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
    const isZipFile = file.name.endsWith('.zip') || file.type === 'application/zip';

    if (isZipFile) {
      console.log('Processing ZIP file...');
      
      // Convert file to Uint8Array for decompression
      const arrayBuffer = await file.arrayBuffer();
      const zipData = new Uint8Array(arrayBuffer);
      
      try {
        // Write zip to temporary file
        const tempZipPath = `/tmp/${crypto.randomUUID()}.zip`;
        await Deno.writeFile(tempZipPath, zipData);
        
        // Extract to temporary directory
        const extractPath = `/tmp/${crypto.randomUUID()}`;
        await Deno.mkdir(extractPath, { recursive: true });
        
        await decompress(tempZipPath, extractPath);
        console.log('ZIP extracted to:', extractPath);
        
        // Upload the original ZIP file
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
          })
          .select()
          .single();

        if (zipDbError) {
          console.error('Error saving ZIP to database:', zipDbError);
          throw zipDbError;
        }

        console.log('ZIP saved to database:', zipRecord.id);
        uploadedFiles.push(zipRecord);

        // Process extracted files
        const processDirectory = async (dirPath: string, relativePath = '') => {
          for await (const entry of Deno.readDir(dirPath)) {
            const fullPath = `${dirPath}/${entry.name}`;
            const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

            if (entry.isDirectory) {
              await processDirectory(fullPath, relPath);
            } else if (entry.isFile) {
              console.log('Processing extracted file:', relPath);
              
              const extractedFileData = await Deno.readFile(fullPath);
              const stat = await Deno.stat(fullPath);
              
              // Determine file type from extension
              const ext = entry.name.split('.').pop()?.toLowerCase() || '';
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
              };
              const fileType = mimeTypes[ext] || 'application/octet-stream';
              
              // Upload extracted file
              const extractedFileName = `${user.id}/${Date.now()}-${relPath.replace(/\//g, '_')}`;
              const { data: extractedUploadData, error: extractedUploadError } = await supabase.storage
                .from('uploads')
                .upload(extractedFileName, extractedFileData, {
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
                  file_name: entry.name,
                  file_size: stat.size,
                  file_type: fileType,
                  file_path: extractedUploadData.path,
                  original_name: relPath,
                  is_extracted: false,
                  parent_zip_id: zipRecord.id,
                })
                .select()
                .single();

              if (extractedDbError) {
                console.error('Error saving extracted file to database:', extractedDbError);
                continue;
              }

              console.log('Extracted file saved to database:', extractedRecord.id);
              uploadedFiles.push(extractedRecord);
            }
          }
        };

        await processDirectory(extractPath);
        
        // Cleanup temporary files
        await Deno.remove(tempZipPath);
        await Deno.remove(extractPath, { recursive: true });
        
      } catch (error) {
        console.error('Error processing ZIP file:', error);
        throw error;
      }
    } else {
      // Upload regular file
      console.log('Uploading regular file...');
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const fileData = await file.arrayBuffer();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, fileData, {
          contentType: file.type,
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
          file_type: file.type,
          file_path: uploadData.path,
          original_name: file.name,
          is_extracted: false,
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
          ? `ZIP file extracted and ${uploadedFiles.length - 1} files uploaded successfully`
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
