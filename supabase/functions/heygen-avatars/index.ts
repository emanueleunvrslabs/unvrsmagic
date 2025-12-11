import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get owner's HeyGen API key
    const { data: ownerRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'owner')
      .single();

    if (!ownerRole) {
      return new Response(
        JSON.stringify({ error: 'Owner not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', ownerRole.user_id)
      .eq('provider', 'heygen')
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error('HeyGen API key not found:', apiKeyError);
      return new Response(
        JSON.stringify({ error: 'HeyGen API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch STREAMING/INTERACTIVE avatars from HeyGen API
    // This endpoint returns only avatars that can be used for live streaming
    console.log('Fetching streaming avatars from HeyGen API...');
    const response = await fetch('https://api.heygen.com/v1/streaming/avatar.list', {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKeyData.api_key,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HeyGen API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch streaming avatars from HeyGen', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('HeyGen streaming avatars response:', JSON.stringify(data).substring(0, 500));

    // Format the response - streaming avatars have different structure
    const avatars = (data.data || []).map((avatar: any) => ({
      avatar_id: avatar.avatar_id,
      avatar_name: avatar.pose_name || avatar.avatar_name || avatar.avatar_id,
      preview_image_url: avatar.normal_preview || avatar.preview_image_url,
      default_voice: avatar.default_voice,
      status: avatar.status,
    }));

    console.log(`Found ${avatars.length} streaming avatars`);

    return new Response(
      JSON.stringify({ avatars }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in heygen-avatars function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
