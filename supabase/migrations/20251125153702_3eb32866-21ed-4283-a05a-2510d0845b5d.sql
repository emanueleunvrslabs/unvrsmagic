-- Create table for intermediate processing results
CREATE TABLE public.dispatch_intermediate_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.dispatch_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_id UUID REFERENCES public.dispatch_files(id) ON DELETE CASCADE,
  result_type TEXT NOT NULL, -- 'pod_codes', 'letture_data', 'ip_curve', 'anagrafica'
  zone_code TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispatch_intermediate_results ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own intermediate results"
  ON public.dispatch_intermediate_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all intermediate results"
  ON public.dispatch_intermediate_results
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_intermediate_results_job ON public.dispatch_intermediate_results(job_id);
CREATE INDEX idx_intermediate_results_user ON public.dispatch_intermediate_results(user_id);
CREATE INDEX idx_intermediate_results_file ON public.dispatch_intermediate_results(file_id);

-- Add trigger for updated_at
CREATE TRIGGER update_intermediate_results_updated_at
  BEFORE UPDATE ON public.dispatch_intermediate_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();