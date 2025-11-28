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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user with the anon key client
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Get all files for this user
    const { data: files, error: fetchError } = await supabase
      .from('uploaded_files')
      .select('file_path')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching files:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${files?.length || 0} files to delete`);

    // Delete all files from storage
    if (files && files.length > 0) {
      const filePaths = files.map(f => f.file_path);
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('uploads')
        .remove(filePaths);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        throw storageError;
      }

      console.log('Deleted files from storage:', storageData);
    }

    // Delete all database records
    const { error: dbError } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      throw dbError;
    }

    console.log('Deleted all records from database');

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: files?.length || 0,
        message: 'All files deleted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Delete failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
