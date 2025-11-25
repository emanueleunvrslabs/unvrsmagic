-- Create dispatch zones table
CREATE TABLE IF NOT EXISTS public.dispatch_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert Italian energy zones
INSERT INTO public.dispatch_zones (code, name) VALUES
  ('NORD', 'Nord'),
  ('CNOR', 'Centro Nord'),
  ('CSUD', 'Centro Sud'),
  ('SUD', 'Sud'),
  ('CALA', 'Calabria'),
  ('SARD', 'Sardegna'),
  ('SICI', 'Sicilia')
ON CONFLICT (code) DO NOTHING;

-- Create dispatch files table
CREATE TABLE IF NOT EXISTS public.dispatch_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  zone_code text REFERENCES public.dispatch_zones(code),
  file_type text NOT NULL, -- PDO, PDO2G, SOS, S2G, AGGR_IP, ANAGRAFICA
  file_name text NOT NULL,
  file_url text,
  file_size bigint,
  upload_source text, -- 'direct' or 'url'
  month_reference text, -- YYYY-MM format
  status text DEFAULT 'uploaded', -- uploaded, processing, processed, error
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dispatch PODs table
CREATE TABLE IF NOT EXISTS public.dispatch_pods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  zone_code text NOT NULL REFERENCES public.dispatch_zones(code),
  pod_code text NOT NULL,
  meter_type text NOT NULL, -- O (orario) or LP (non orario)
  annual_consumption numeric,
  monthly_consumption numeric,
  distributor text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, zone_code, pod_code)
);

-- Create dispatch jobs table
CREATE TABLE IF NOT EXISTS public.dispatch_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  zone_code text NOT NULL REFERENCES public.dispatch_zones(code),
  dispatch_month text NOT NULL, -- YYYY-MM format (target month)
  historical_month text NOT NULL, -- YYYY-MM format (T-12 month)
  status text DEFAULT 'pending', -- pending, running, completed, failed
  progress integer DEFAULT 0,
  current_agent text,
  agents_state jsonb DEFAULT '{}',
  warnings jsonb DEFAULT '[]',
  errors jsonb DEFAULT '[]',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dispatch results table
CREATE TABLE IF NOT EXISTS public.dispatch_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  job_id uuid REFERENCES public.dispatch_jobs(id) ON DELETE CASCADE,
  zone_code text NOT NULL REFERENCES public.dispatch_zones(code),
  dispatch_month text NOT NULL,
  curve_96_values jsonb NOT NULL, -- Array of 96 quarter-hour values
  ip_curve jsonb, -- IP contribution
  o_curve jsonb, -- Orari PODs contribution
  lp_curve jsonb, -- LP PODs contribution
  total_pods integer,
  pods_with_data integer,
  pods_without_data integer,
  quality_score numeric,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dispatch agents state table
CREATE TABLE IF NOT EXISTS public.dispatch_agents_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  job_id uuid REFERENCES public.dispatch_jobs(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  status text DEFAULT 'idle', -- idle, running, completed, failed
  progress integer DEFAULT 0,
  result jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispatch_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_agents_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispatch_files
CREATE POLICY "Users can view their own files"
  ON public.dispatch_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON public.dispatch_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON public.dispatch_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON public.dispatch_files FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dispatch_pods
CREATE POLICY "Users can view their own pods"
  ON public.dispatch_pods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pods"
  ON public.dispatch_pods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pods"
  ON public.dispatch_pods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pods"
  ON public.dispatch_pods FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dispatch_jobs
CREATE POLICY "Users can view their own jobs"
  ON public.dispatch_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
  ON public.dispatch_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.dispatch_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for dispatch_results
CREATE POLICY "Users can view their own results"
  ON public.dispatch_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
  ON public.dispatch_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for dispatch_agents_state
CREATE POLICY "Users can view their own agents state"
  ON public.dispatch_agents_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage agents state"
  ON public.dispatch_agents_state FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_dispatch_files_user_zone ON public.dispatch_files(user_id, zone_code);
CREATE INDEX idx_dispatch_files_type ON public.dispatch_files(file_type);
CREATE INDEX idx_dispatch_files_month ON public.dispatch_files(month_reference);
CREATE INDEX idx_dispatch_pods_user_zone ON public.dispatch_pods(user_id, zone_code);
CREATE INDEX idx_dispatch_jobs_user_month ON public.dispatch_jobs(user_id, dispatch_month);
CREATE INDEX idx_dispatch_results_job ON public.dispatch_results(job_id);

-- Create update trigger for updated_at
CREATE TRIGGER update_dispatch_files_updated_at
  BEFORE UPDATE ON public.dispatch_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dispatch_pods_updated_at
  BEFORE UPDATE ON public.dispatch_pods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dispatch_jobs_updated_at
  BEFORE UPDATE ON public.dispatch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dispatch_results_updated_at
  BEFORE UPDATE ON public.dispatch_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();