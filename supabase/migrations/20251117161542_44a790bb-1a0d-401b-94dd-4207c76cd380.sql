-- Tabella per salvare i risultati dell'agente MKT.DATA
CREATE TABLE public.mkt_data_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  market_type TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  ohlcv JSONB NOT NULL,
  data_sources JSONB,
  confidence_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mkt_data_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own mkt data results" 
ON public.mkt_data_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all mkt data results" 
ON public.mkt_data_results 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger per updated_at
CREATE TRIGGER update_mkt_data_results_updated_at
BEFORE UPDATE ON public.mkt_data_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index per performance
CREATE INDEX idx_mkt_data_results_user_symbol ON public.mkt_data_results(user_id, symbol);
CREATE INDEX idx_mkt_data_results_created_at ON public.mkt_data_results(created_at DESC);
CREATE INDEX idx_mkt_data_results_market_type ON public.mkt_data_results(market_type);
CREATE INDEX idx_mkt_data_results_timeframe ON public.mkt_data_results(timeframe);

-- Tabella per la configurazione dell'agente MKT.DATA
CREATE TABLE public.mkt_data_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  symbols TEXT[] NOT NULL DEFAULT ARRAY['BTCUSDT', 'ETHUSDT'],
  timeframes TEXT[] NOT NULL DEFAULT ARRAY['1h', '4h', '1d'],
  lookback_bars INTEGER NOT NULL DEFAULT 100,
  market_types TEXT[] NOT NULL DEFAULT ARRAY['spot', 'futures'],
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mkt_data_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own mkt data config" 
ON public.mkt_data_config 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mkt data config" 
ON public.mkt_data_config 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mkt data config" 
ON public.mkt_data_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all mkt data config" 
ON public.mkt_data_config 
FOR SELECT 
USING (true);

-- Trigger per updated_at
CREATE TRIGGER update_mkt_data_config_updated_at
BEFORE UPDATE ON public.mkt_data_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime per mkt_data_results
ALTER PUBLICATION supabase_realtime ADD TABLE public.mkt_data_results;