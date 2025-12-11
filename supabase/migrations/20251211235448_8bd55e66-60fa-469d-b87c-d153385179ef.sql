-- Fix missing RLS policies for critical tables

-- 1. profiles table - users can only see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. api_keys table - users can only manage their own keys
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON public.api_keys;

CREATE POLICY "Users can view own api keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- 3. exchange_keys table - users can only manage their own exchange keys
DROP POLICY IF EXISTS "Users can view own exchange keys" ON public.exchange_keys;
DROP POLICY IF EXISTS "Users can insert own exchange keys" ON public.exchange_keys;
DROP POLICY IF EXISTS "Users can update own exchange keys" ON public.exchange_keys;
DROP POLICY IF EXISTS "Users can delete own exchange keys" ON public.exchange_keys;

CREATE POLICY "Users can view own exchange keys" ON public.exchange_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exchange keys" ON public.exchange_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exchange keys" ON public.exchange_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exchange keys" ON public.exchange_keys
  FOR DELETE USING (auth.uid() = user_id);

-- 4. client_contacts table - users can only manage contacts for their clients
DROP POLICY IF EXISTS "Users can view own client contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can insert own client contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can update own client contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can delete own client contacts" ON public.client_contacts;

CREATE POLICY "Users can view own client contacts" ON public.client_contacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_contacts.client_id AND clients.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own client contacts" ON public.client_contacts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_contacts.client_id AND clients.user_id = auth.uid())
  );

CREATE POLICY "Users can update own client contacts" ON public.client_contacts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_contacts.client_id AND clients.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own client contacts" ON public.client_contacts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_contacts.client_id AND clients.user_id = auth.uid())
  );

-- 5. client_emails table - users can only access their own emails
DROP POLICY IF EXISTS "Users can view own client emails" ON public.client_emails;
DROP POLICY IF EXISTS "Users can insert own client emails" ON public.client_emails;
DROP POLICY IF EXISTS "Users can update own client emails" ON public.client_emails;
DROP POLICY IF EXISTS "Users can delete own client emails" ON public.client_emails;

CREATE POLICY "Users can view own client emails" ON public.client_emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client emails" ON public.client_emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client emails" ON public.client_emails
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client emails" ON public.client_emails
  FOR DELETE USING (auth.uid() = user_id);

-- 6. whatsapp_messages table - users can only access their own messages
DROP POLICY IF EXISTS "Users can view own whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert own whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can update own whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can delete own whatsapp messages" ON public.whatsapp_messages;

CREATE POLICY "Users can view own whatsapp messages" ON public.whatsapp_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whatsapp messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whatsapp messages" ON public.whatsapp_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own whatsapp messages" ON public.whatsapp_messages
  FOR DELETE USING (auth.uid() = user_id);

-- 7. credit_transactions table - users can only view their own transactions
DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can insert own credit transactions" ON public.credit_transactions;

CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Insert is handled by database functions with SECURITY DEFINER, not direct user access
CREATE POLICY "Service role can insert credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (true);

-- 8. clients table - users can only manage their own clients
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);