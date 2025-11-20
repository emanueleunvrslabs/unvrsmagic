-- Create agent_logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  log_level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  action TEXT,
  duration_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agent logs"
ON public.agent_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all agent logs"
ON public.agent_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX idx_agent_logs_agent_name ON public.agent_logs(agent_name, timestamp DESC);
CREATE INDEX idx_agent_logs_user_id ON public.agent_logs(user_id, timestamp DESC);
CREATE INDEX idx_agent_logs_level ON public.agent_logs(log_level, timestamp DESC);