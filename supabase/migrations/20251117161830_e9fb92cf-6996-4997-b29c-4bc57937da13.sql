-- Add unique constraint for mkt_data_results
ALTER TABLE public.mkt_data_results
ADD CONSTRAINT mkt_data_results_unique_key UNIQUE (user_id, symbol, market_type, timeframe);