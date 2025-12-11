import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as x509 from "https://esm.sh/@peculiar/x509@1.9.5";
import { corsHeaders } from '../_shared/cors.ts';

// Set crypto provider
x509.cryptoProvider.set(crypto);

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

    console.log('Generating RSA key pair for user:', user.id);

    // Generate RSA-2048 key pair
    const alg = {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
      publicExponent: new Uint8Array([1, 0, 1]),
      modulusLength: 2048,
    };

    const keys = await crypto.subtle.generateKey(alg, true, ["sign", "verify"]);

    console.log('Key pair generated, creating X509 certificate...');

    // Create self-signed X509 certificate
    const cert = await x509.X509CertificateGenerator.createSelfSigned({
      serialNumber: "01",
      name: "CN=UNVRS Labs",
      notBefore: new Date(),
      notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      signingAlgorithm: alg,
      keys: keys,
      extensions: [
        new x509.BasicConstraintsExtension(false, undefined, true),
        new x509.KeyUsagesExtension(
          x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyEncipherment,
          true
        ),
      ],
    });

    console.log('X509 certificate created');

    // Export certificate to PEM format
    const certPem = cert.toString("pem");
    
    // Export private key to PEM format
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keys.privateKey);
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

    console.log('Certificate PEM:', certPem.substring(0, 100) + '...');

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
        publicKey: certPem,
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
