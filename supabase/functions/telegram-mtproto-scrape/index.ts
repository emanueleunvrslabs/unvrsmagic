import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

// MTCute for MTProto - Deno compatible
import { TelegramClient, MemoryStorage } from "https://esm.sh/jsr/@mtcute/deno@0.26.3";

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

    // Get API credentials
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
        JSON.stringify({ error: 'Telegram API credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiId = parseInt(apiIdData.api_key);
    const apiHash = apiHashData.api_key;

    // Get active session
    const { data: session } = await supabase
      .from('telegram_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'No active Telegram session. Please authenticate first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, groupId, groupUsername, limit = 200 } = await req.json();

    console.log(`Telegram MTProto scrape action: ${action}`);

    // Connect to Telegram
    const stringSession = new StringSession(session.session_string);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();

    try {
      switch (action) {
        case 'getDialogs': {
          // Get all chats/groups the user is part of
          const dialogs = await client.getDialogs({ limit: 100 });
          
          const groups = dialogs
            .filter((d: any) => d.isGroup || d.isChannel)
            .map((d: any) => ({
              id: d.id?.toString(),
              title: d.title,
              username: d.entity?.username,
              participantsCount: d.entity?.participantsCount,
              isChannel: d.isChannel,
              isGroup: d.isGroup,
              isMegagroup: d.entity?.megagroup || false,
            }));

          await client.disconnect();

          return new Response(
            JSON.stringify({ success: true, groups }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'scrapeMembers': {
          if (!groupId && !groupUsername) {
            await client.disconnect();
            return new Response(
              JSON.stringify({ error: 'Group ID or username required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Get the group entity
          let entity;
          try {
            entity = await client.getEntity(groupUsername || groupId);
          } catch (error) {
            console.error('Error getting entity:', error);
            await client.disconnect();
            return new Response(
              JSON.stringify({ error: 'Group not found or not accessible' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Save or update group in database
          const { data: groupData, error: groupError } = await supabase
            .from('telegram_groups')
            .upsert({
              user_id: user.id,
              session_id: session.id,
              telegram_group_id: BigInt(entity.id?.toString() || '0'),
              group_name: (entity as any).title || groupUsername,
              group_username: (entity as any).username || null,
              group_type: (entity as any).megagroup ? 'supergroup' : (entity as any).broadcast ? 'channel' : 'group',
              member_count: (entity as any).participantsCount || 0,
              last_scraped_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,telegram_group_id'
            })
            .select()
            .single();

          if (groupError) {
            console.error('Error saving group:', groupError);
          }

          // Scrape members
          const members: any[] = [];
          let offset = 0;
          const batchSize = 100;
          
          try {
            // For supergroups/channels, use getParticipants
            if ((entity as any).megagroup || (entity as any).broadcast) {
              let hasMore = true;
              
              while (hasMore && members.length < limit) {
                const result = await client.invoke(
                  new Api.channels.GetParticipants({
                    channel: entity,
                    filter: new Api.ChannelParticipantsRecent(),
                    offset,
                    limit: Math.min(batchSize, limit - members.length),
                    hash: 0 as any
                  })
                );

                if ('users' in result && result.users) {
                  for (const u of result.users) {
                    if ('id' in u) {
                      members.push({
                        telegram_user_id: u.id?.toString(),
                        username: (u as any).username || null,
                        first_name: (u as any).firstName || null,
                        last_name: (u as any).lastName || null,
                        phone: (u as any).phone || null,
                        is_bot: (u as any).bot || false,
                        is_premium: (u as any).premium || false,
                      });
                    }
                  }

                  if (result.users.length < batchSize) {
                    hasMore = false;
                  } else {
                    offset += batchSize;
                    // Rate limiting - wait a bit between requests
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                } else {
                  hasMore = false;
                }
              }
            } else {
              // For regular groups, use the full participants list
              const fullChat = await client.invoke(
                new Api.messages.GetFullChat({
                  chatId: parseInt(entity.id?.toString() || '0') as any
                })
              );

              if ('users' in fullChat) {
                for (const u of fullChat.users) {
                  if ('id' in u && members.length < limit) {
                    members.push({
                      telegram_user_id: u.id?.toString(),
                      username: (u as any).username || null,
                      first_name: (u as any).firstName || null,
                      last_name: (u as any).lastName || null,
                      phone: (u as any).phone || null,
                      is_bot: (u as any).bot || false,
                      is_premium: (u as any).premium || false,
                    });
                  }
                }
              }
            }
          } catch (error: any) {
            console.error('Error scraping members:', error);
            
            // Check for FloodWait error
            if (error.message?.includes('FLOOD_WAIT') || error.seconds) {
              const waitSeconds = error.seconds || 60;
              await client.disconnect();
              return new Response(
                JSON.stringify({ 
                  error: `Rate limited. Please wait ${waitSeconds} seconds before trying again.`,
                  floodWait: waitSeconds
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          await client.disconnect();

          // Save members to database
          if (groupData && members.length > 0) {
            const membersToInsert = members.map(m => ({
              user_id: user.id,
              group_id: groupData.id,
              ...m,
              scraped_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
              .from('telegram_members')
              .upsert(membersToInsert, {
                onConflict: 'group_id,telegram_user_id'
              });

            if (insertError) {
              console.error('Error saving members:', insertError);
            }
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              group: groupData,
              membersCount: members.length,
              members 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        default:
          await client.disconnect();
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    } catch (error) {
      await client.disconnect();
      throw error;
    }

  } catch (error) {
    console.error('Telegram MTProto scrape error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
