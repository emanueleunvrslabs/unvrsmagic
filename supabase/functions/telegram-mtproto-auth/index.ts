import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

// GramJS for MTProto - using the Deno-compatible version
import { TelegramClient, Api } from "https://esm.sh/telegram@2.22.2";
import { StringSession } from "https://esm.sh/telegram@2.22.2/sessions";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API credentials from user's api_keys
    const { data: apiIdData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'telegram_api_id')
      .single();

    const { data: apiHashData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'telegram_api_hash')
      .single();

    if (!apiIdData || !apiHashData) {
      return new Response(
        JSON.stringify({ error: 'Telegram API credentials not configured. Please add API ID and API Hash in Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiId = parseInt(apiIdData.api_key);
    const apiHash = apiHashData.api_key;

    const { action, phoneNumber, phoneCode, password, sessionString } = await req.json();

    console.log(`Telegram MTProto auth action: ${action}`);

    switch (action) {
      case 'sendCode': {
        // Start new session and send verification code
        const stringSession = new StringSession('');
        const client = new TelegramClient(stringSession, apiId, apiHash, {
          connectionRetries: 5,
        });

        await client.connect();

        const result = await client.sendCode(
          { apiId, apiHash },
          phoneNumber
        );

        // Save temporary session
        const tempSessionString = client.session.save() as unknown as string;
        
        await client.disconnect();

        return new Response(
          JSON.stringify({ 
            success: true, 
            phoneCodeHash: result.phoneCodeHash,
            sessionString: tempSessionString
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'signIn': {
        // Complete sign in with code
        const stringSession = new StringSession(sessionString || '');
        const client = new TelegramClient(stringSession, apiId, apiHash, {
          connectionRetries: 5,
        });

        await client.connect();

        try {
          await client.invoke(
            new Api.auth.SignIn({
              phoneNumber,
              phoneCodeHash: phoneCode.hash,
              phoneCode: phoneCode.code,
            })
          );

          // Save the authenticated session
          const finalSessionString = client.session.save() as unknown as string;
          
          // Get user info
          const me = await client.getMe();

          // Save session to database
          const { data: sessionData, error: saveError } = await supabase
            .from('telegram_sessions')
            .insert({
              user_id: user.id,
              session_name: `${me?.firstName || 'Telegram'} Session`,
              session_string: finalSessionString,
              phone_number: phoneNumber,
              is_active: true
            })
            .select()
            .single();

          await client.disconnect();

          if (saveError) {
            console.error('Error saving session:', saveError);
            return new Response(
              JSON.stringify({ error: 'Failed to save session' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              session: sessionData,
              user: {
                id: me?.id?.toString(),
                firstName: me?.firstName,
                lastName: me?.lastName,
                username: me?.username,
                phone: me?.phone
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error: any) {
          await client.disconnect();
          
          if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
            return new Response(
              JSON.stringify({ 
                needs2FA: true, 
                sessionString: client.session.save() as unknown as string 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          throw error;
        }
      }

      case 'signIn2FA': {
        // Complete sign in with 2FA password
        const stringSession = new StringSession(sessionString || '');
        const client = new TelegramClient(stringSession, apiId, apiHash, {
          connectionRetries: 5,
        });

        await client.connect();

        await client.signInWithPassword(
          { apiId, apiHash },
          {
            password: async () => password,
            onError: (err) => {
              console.error('2FA error:', err);
              throw err;
            }
          }
        );

        const finalSessionString = client.session.save() as unknown as string;
        const me = await client.getMe();

        // Save session to database
        const { data: sessionData, error: saveError } = await supabase
          .from('telegram_sessions')
          .insert({
            user_id: user.id,
            session_name: `${me?.firstName || 'Telegram'} Session`,
            session_string: finalSessionString,
            phone_number: phoneNumber,
            is_active: true
          })
          .select()
          .single();

        await client.disconnect();

        if (saveError) {
          console.error('Error saving session:', saveError);
          return new Response(
            JSON.stringify({ error: 'Failed to save session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            session: sessionData,
            user: {
              id: me?.id?.toString(),
              firstName: me?.firstName,
              lastName: me?.lastName,
              username: me?.username,
              phone: me?.phone
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'checkSession': {
        // Check if existing session is still valid
        const { data: sessions } = await supabase
          .from('telegram_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!sessions || sessions.length === 0) {
          return new Response(
            JSON.stringify({ hasActiveSession: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Try to connect with the most recent session
        const session = sessions[0];
        const stringSession = new StringSession(session.session_string);
        const client = new TelegramClient(stringSession, apiId, apiHash, {
          connectionRetries: 3,
        });

        try {
          await client.connect();
          const me = await client.getMe();
          await client.disconnect();

          return new Response(
            JSON.stringify({ 
              hasActiveSession: true, 
              session,
              user: {
                id: me?.id?.toString(),
                firstName: me?.firstName,
                lastName: me?.lastName,
                username: me?.username,
                phone: me?.phone
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Session check failed:', error);
          
          // Mark session as inactive
          await supabase
            .from('telegram_sessions')
            .update({ is_active: false })
            .eq('id', session.id);

          return new Response(
            JSON.stringify({ hasActiveSession: false, error: 'Session expired' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'logout': {
        // Deactivate all sessions
        await supabase
          .from('telegram_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Telegram MTProto auth error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
