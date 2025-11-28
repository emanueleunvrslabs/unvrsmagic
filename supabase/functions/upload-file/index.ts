import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Upload file to storage
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

    console.log('File uploaded to storage:', uploadData.path);

    // Determine if it's a ZIP file
    const isZipFile = file.name.toLowerCase().endsWith('.zip') || 
                      file.type === 'application/zip' ||
                      file.type === 'application/x-zip-compressed';

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
          is_zip: isZipFile,
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        file: fileRecord,
        message: isZipFile 
          ? 'ZIP file uploaded successfully. You can extract it later.'
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
