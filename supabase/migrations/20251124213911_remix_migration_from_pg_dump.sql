CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: cleanup_expired_otps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_otps() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: agent_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    agent_name text NOT NULL,
    alert_type text NOT NULL,
    severity text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_name text NOT NULL,
    user_id uuid NOT NULL,
    log_level text NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    action text,
    duration_ms integer,
    "timestamp" timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: agent_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_agent text NOT NULL,
    receiver_agent text NOT NULL,
    message_type text NOT NULL,
    payload jsonb NOT NULL,
    priority integer DEFAULT 5,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    user_id uuid NOT NULL
);


--
-- Name: agent_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    agent_id text NOT NULL,
    prompt text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_state (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_name text NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'idle'::text,
    last_execution timestamp with time zone,
    last_error text,
    performance_metrics jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    api_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    owner_id text
);


--
-- Name: exchange_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exchange text NOT NULL,
    api_key text NOT NULL,
    api_secret text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    passphrase text
);


--
-- Name: mkt_data_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mkt_data_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    symbols text[] DEFAULT ARRAY['BTCUSDT'::text, 'ETHUSDT'::text] NOT NULL,
    timeframes text[] DEFAULT ARRAY['1h'::text, '4h'::text, '1d'::text] NOT NULL,
    lookback_bars integer DEFAULT 500 NOT NULL,
    market_types text[] DEFAULT ARRAY['spot'::text, 'futures'::text] NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mkt_data_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mkt_data_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    symbol text NOT NULL,
    market_type text NOT NULL,
    timeframe text NOT NULL,
    ohlcv jsonb NOT NULL,
    data_sources jsonb,
    confidence_score integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number text NOT NULL,
    code text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    phone_number text NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    username text,
    CONSTRAINT username_format CHECK (((username = lower(username)) AND (username !~ '\s'::text)))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);


--
-- Name: agent_alerts agent_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_alerts
    ADD CONSTRAINT agent_alerts_pkey PRIMARY KEY (id);


--
-- Name: agent_logs agent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_logs
    ADD CONSTRAINT agent_logs_pkey PRIMARY KEY (id);


--
-- Name: agent_messages agent_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_pkey PRIMARY KEY (id);


--
-- Name: agent_prompts agent_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_prompts
    ADD CONSTRAINT agent_prompts_pkey PRIMARY KEY (id);


--
-- Name: agent_prompts agent_prompts_user_id_agent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_prompts
    ADD CONSTRAINT agent_prompts_user_id_agent_id_key UNIQUE (user_id, agent_id);


--
-- Name: agent_state agent_state_agent_name_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_state
    ADD CONSTRAINT agent_state_agent_name_user_id_key UNIQUE (agent_name, user_id);


--
-- Name: agent_state agent_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_state
    ADD CONSTRAINT agent_state_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_provider_key UNIQUE (user_id, provider);


--
-- Name: exchange_keys exchange_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_keys
    ADD CONSTRAINT exchange_keys_pkey PRIMARY KEY (id);


--
-- Name: exchange_keys exchange_keys_user_id_exchange_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_keys
    ADD CONSTRAINT exchange_keys_user_id_exchange_key UNIQUE (user_id, exchange);


--
-- Name: mkt_data_config mkt_data_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mkt_data_config
    ADD CONSTRAINT mkt_data_config_pkey PRIMARY KEY (id);


--
-- Name: mkt_data_config mkt_data_config_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mkt_data_config
    ADD CONSTRAINT mkt_data_config_user_id_key UNIQUE (user_id);


--
-- Name: mkt_data_results mkt_data_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mkt_data_results
    ADD CONSTRAINT mkt_data_results_pkey PRIMARY KEY (id);


--
-- Name: mkt_data_results mkt_data_results_unique_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mkt_data_results
    ADD CONSTRAINT mkt_data_results_unique_key UNIQUE (user_id, symbol, market_type, timeframe);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_phone_number_key UNIQUE (phone_number);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: idx_agent_alerts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_alerts_created_at ON public.agent_alerts USING btree (created_at DESC);


--
-- Name: idx_agent_alerts_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_alerts_read ON public.agent_alerts USING btree (read);


--
-- Name: idx_agent_alerts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_alerts_user_id ON public.agent_alerts USING btree (user_id);


--
-- Name: idx_agent_logs_agent_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_logs_agent_name ON public.agent_logs USING btree (agent_name, "timestamp" DESC);


--
-- Name: idx_agent_logs_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_logs_level ON public.agent_logs USING btree (log_level, "timestamp" DESC);


--
-- Name: idx_agent_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_logs_user_id ON public.agent_logs USING btree (user_id, "timestamp" DESC);


--
-- Name: idx_agent_messages_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_messages_receiver ON public.agent_messages USING btree (receiver_agent, status, created_at);


--
-- Name: idx_agent_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_messages_sender ON public.agent_messages USING btree (sender_agent, created_at);


--
-- Name: idx_agent_messages_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_messages_user ON public.agent_messages USING btree (user_id, created_at);


--
-- Name: idx_mkt_data_results_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mkt_data_results_created_at ON public.mkt_data_results USING btree (created_at DESC);


--
-- Name: idx_mkt_data_results_market_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mkt_data_results_market_type ON public.mkt_data_results USING btree (market_type);


--
-- Name: idx_mkt_data_results_timeframe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mkt_data_results_timeframe ON public.mkt_data_results USING btree (timeframe);


--
-- Name: idx_mkt_data_results_user_symbol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mkt_data_results_user_symbol ON public.mkt_data_results USING btree (user_id, symbol);


--
-- Name: idx_otp_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes USING btree (expires_at);


--
-- Name: idx_otp_codes_phone_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otp_codes_phone_number ON public.otp_codes USING btree (phone_number);


--
-- Name: idx_profiles_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);


--
-- Name: agent_prompts update_agent_prompts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agent_prompts_updated_at BEFORE UPDATE ON public.agent_prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agent_state update_agent_state_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agent_state_updated_at BEFORE UPDATE ON public.agent_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: api_keys update_api_keys_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: exchange_keys update_exchange_keys_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_exchange_keys_updated_at BEFORE UPDATE ON public.exchange_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mkt_data_config update_mkt_data_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mkt_data_config_updated_at BEFORE UPDATE ON public.mkt_data_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mkt_data_results update_mkt_data_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mkt_data_results_updated_at BEFORE UPDATE ON public.mkt_data_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: otp_codes Service role can manage OTP codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage OTP codes" ON public.otp_codes USING (true);


--
-- Name: agent_logs Service role can manage all agent logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage all agent logs" ON public.agent_logs TO service_role USING (true) WITH CHECK (true);


--
-- Name: agent_messages Service role can manage all agent messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage all agent messages" ON public.agent_messages TO service_role USING (true) WITH CHECK (true);


--
-- Name: agent_state Service role can manage all agent states; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage all agent states" ON public.agent_state TO service_role USING (true) WITH CHECK (true);


--
-- Name: mkt_data_results Service role can manage all mkt data results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage all mkt data results" ON public.mkt_data_results USING (true) WITH CHECK (true);


--
-- Name: mkt_data_config Service role can read all mkt data config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can read all mkt data config" ON public.mkt_data_config FOR SELECT USING (true);


--
-- Name: agent_alerts System can insert alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert alerts" ON public.agent_alerts FOR INSERT WITH CHECK (true);


--
-- Name: exchange_keys Users can create their own exchange keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own exchange keys" ON public.exchange_keys FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: projects Users can create their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: api_keys Users can delete their own API keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own API keys" ON public.api_keys FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: exchange_keys Users can delete their own exchange keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own exchange keys" ON public.exchange_keys FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: projects Users can delete their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: agent_prompts Users can delete their own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own prompts" ON public.agent_prompts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can insert their own API keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own API keys" ON public.api_keys FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: mkt_data_config Users can insert their own mkt data config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own mkt data config" ON public.mkt_data_config FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: agent_prompts Users can insert their own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own prompts" ON public.agent_prompts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: api_keys Users can update their own API keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own API keys" ON public.api_keys FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: agent_alerts Users can update their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own alerts" ON public.agent_alerts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: exchange_keys Users can update their own exchange keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own exchange keys" ON public.exchange_keys FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: mkt_data_config Users can update their own mkt data config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own mkt data config" ON public.mkt_data_config FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: projects Users can update their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: agent_prompts Users can update their own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own prompts" ON public.agent_prompts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can view their own API keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own API keys" ON public.api_keys FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agent_logs Users can view their own agent logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own agent logs" ON public.agent_logs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: agent_messages Users can view their own agent messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own agent messages" ON public.agent_messages FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: agent_state Users can view their own agent states; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own agent states" ON public.agent_state FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: agent_alerts Users can view their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alerts" ON public.agent_alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: exchange_keys Users can view their own exchange keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own exchange keys" ON public.exchange_keys FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: mkt_data_config Users can view their own mkt data config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own mkt data config" ON public.mkt_data_config FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: mkt_data_results Users can view their own mkt data results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own mkt data results" ON public.mkt_data_results FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: projects Users can view their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agent_prompts Users can view their own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own prompts" ON public.agent_prompts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agent_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_prompts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_state ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: exchange_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exchange_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: mkt_data_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mkt_data_config ENABLE ROW LEVEL SECURITY;

--
-- Name: mkt_data_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mkt_data_results ENABLE ROW LEVEL SECURITY;

--
-- Name: otp_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


