-- Create agent_alerts table for critical notifications
CREATE TABLE public.agent_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'critical_signal', 'price_anomaly', 'volume_spike', 'error'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own alerts"
ON public.agent_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert alerts"
ON public.agent_alerts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own alerts"
ON public.agent_alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_agent_alerts_user_id ON public.agent_alerts(user_id);
CREATE INDEX idx_agent_alerts_created_at ON public.agent_alerts(created_at DESC);
CREATE INDEX idx_agent_alerts_read ON public.agent_alerts(read);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_alerts;