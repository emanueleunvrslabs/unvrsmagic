import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from '../_shared/cors.ts';

const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID');
const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  console.log('LinkedIn OAuth request:', { action, method: req.method });

  try {
    // Handle OAuth callback (GET request from LinkedIn redirect)
    if (req.method === 'GET' && action === 'callback') {
      return await handleCallback(url);
    }

    // Handle start OAuth flow (POST from frontend)
    const body = await req.json();
    console.log('LinkedIn OAuth body:', body);

    if (body.action === 'start') {
      return await startOAuth(body.user_id, body.origin);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function startOAuth(userId: string, origin: string) {
  if (!LINKEDIN_CLIENT_ID) {
    throw new Error('LinkedIn Client ID not configured');
  }

  const redirectUri = `${SUPABASE_URL}/functions/v1/linkedin-oauth?action=callback`;
  
  // LinkedIn OAuth 2.0 scopes for OpenID Connect + posting
  // openid, profile - basic profile access
  // w_member_social - post on behalf of user (personal profile)
  const scopes = [
    'openid',
    'profile',
    'email',
    'w_member_social',
  ].join(' ');

  // State includes user_id and origin for redirect after callback
  const state = JSON.stringify({ user_id: userId, origin });
  const encodedState = btoa(state);

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', encodedState);
  authUrl.searchParams.set('scope', scopes);

  console.log('LinkedIn auth URL generated:', authUrl.toString());

  return new Response(
    JSON.stringify({ authUrl: authUrl.toString() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCallback(url: URL) {
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  console.log('LinkedIn callback received:', { code: !!code, state: !!stateParam, error });

  // Decode state to get user_id and origin
  let userId: string;
  let origin: string;
  
  try {
    const stateData = JSON.parse(atob(stateParam || ''));
    userId = stateData.user_id;
    origin = stateData.origin || 'https://amvbkkbqkzklrcynpwwm.lovableproject.com';
  } catch (e) {
    console.error('Failed to parse state:', e);
    return redirectWithError('Invalid state parameter', 'https://amvbkkbqkzklrcynpwwm.lovableproject.com');
  }

  if (error) {
    console.error('LinkedIn OAuth error:', error, errorDescription);
    return redirectWithError(errorDescription || error, origin);
  }

  if (!code) {
    return redirectWithError('No authorization code received', origin);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, origin);
    console.log('Token exchange successful');

    // Get user profile info
    const profileInfo = await getLinkedInProfile(tokenResponse.access_token);
    console.log('Profile info retrieved:', profileInfo);

    // Store credentials in database
    await storeLinkedInCredentials(userId, tokenResponse, profileInfo);

    // Redirect back to connection page with success
    const redirectUrl = new URL(`${origin}/ai-social/connection`);
    redirectUrl.searchParams.set('linkedin_success', 'true');
    redirectUrl.searchParams.set('name', profileInfo.name || 'LinkedIn User');

    return Response.redirect(redirectUrl.toString(), 302);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return redirectWithError(errorMessage, origin);
  }
}
async function exchangeCodeForToken(code: string, origin: string) {
  const redirectUri = `${SUPABASE_URL}/functions/v1/linkedin-oauth?action=callback`;

  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: LINKEDIN_CLIENT_ID!,
    client_secret: LINKEDIN_CLIENT_SECRET!,
  });

  console.log('Exchanging code for token...');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  const tokenData = await response.json();
  console.log('Token data received:', { 
    hasAccessToken: !!tokenData.access_token, 
    expiresIn: tokenData.expires_in 
  });

  return tokenData;
}

async function getLinkedInProfile(accessToken: string) {
  // Get user profile using OpenID Connect userinfo endpoint
  const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!userInfoResponse.ok) {
    const errorText = await userInfoResponse.text();
    console.error('Failed to get user info:', errorText);
    throw new Error(`Failed to get LinkedIn profile: ${errorText}`);
  }

  const userInfo = await userInfoResponse.json();
  console.log('LinkedIn user info:', userInfo);

  return {
    sub: userInfo.sub, // LinkedIn member URN
    name: userInfo.name,
    email: userInfo.email,
    picture: userInfo.picture,
  };
}

async function storeLinkedInCredentials(
  userId: string, 
  tokenData: any, 
  profileInfo: any
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Store credentials as JSON in api_key field
  const credentials = {
    access_token: tokenData.access_token,
    expires_in: tokenData.expires_in,
    expires_at: Date.now() + (tokenData.expires_in * 1000),
    member_urn: profileInfo.sub,
    name: profileInfo.name,
    email: profileInfo.email,
    picture: profileInfo.picture,
  };

  // Check if LinkedIn connection already exists
  const { data: existing } = await supabase
    .from('api_keys')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', 'linkedin')
    .maybeSingle();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('api_keys')
      .update({
        api_key: JSON.stringify(credentials),
        owner_id: profileInfo.sub,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Failed to update LinkedIn credentials:', error);
      throw new Error('Failed to store LinkedIn credentials');
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        provider: 'linkedin',
        api_key: JSON.stringify(credentials),
        owner_id: profileInfo.sub,
      });

    if (error) {
      console.error('Failed to insert LinkedIn credentials:', error);
      throw new Error('Failed to store LinkedIn credentials');
    }
  }

  console.log('LinkedIn credentials stored successfully');
}

function redirectWithError(error: string, origin: string) {
  const redirectUrl = new URL(`${origin}/ai-social/connection`);
  redirectUrl.searchParams.set('error', error);
  return Response.redirect(redirectUrl.toString(), 302);
}
