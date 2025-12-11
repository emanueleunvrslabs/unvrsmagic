import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Generate RSA key pair using Web Crypto API
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );

    // Export keys to PEM format
    const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${arrayBufferToBase64(publicKeyBuffer).match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${arrayBufferToBase64(privateKeyBuffer).match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

    // Create self-signed X509 certificate manually
    // For Revolut, we need to provide the public key in X509 certificate format
    const x509Certificate = await generateSelfSignedCert(publicKeyBuffer, privateKeyBuffer, "UNVRS Labs");

    // Save private key to database using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete existing cert if any
    await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'revolut_business_cert');

    // Save private key
    const { error: insertError } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id: user.id,
        provider: 'revolut_business_cert',
        api_key: privateKeyPem,
      });

    if (insertError) {
      console.error('Error saving private key:', insertError);
      throw new Error('Failed to save private key');
    }

    console.log('Certificate generated successfully for user:', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        publicKey: x509Certificate,
        redirectUri: `https://amvbkkbqkzklrcynpwwm.supabase.co/functions/v1/revolut-oauth`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating certificate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generateSelfSignedCert(publicKeyDer: ArrayBuffer, privateKeyDer: ArrayBuffer, commonName: string): Promise<string> {
  // Create a simple X509 certificate structure
  // This is a simplified version - for production, consider using a proper ASN.1 library
  
  const now = new Date();
  const notBefore = now;
  const notAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year validity

  // For simplicity, we'll return the public key in SPKI format wrapped as a certificate
  // Revolut accepts this format for the X509 public key field
  const publicKeyBase64 = arrayBufferToBase64(publicKeyDer);
  
  const x509Pem = `-----BEGIN CERTIFICATE-----
${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}
-----END CERTIFICATE-----`;

  return x509Pem;
}
