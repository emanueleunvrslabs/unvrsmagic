-- Aumenta lookback_bars per popolare meglio il grafico con dati storici
-- Da 100 a 500 bars per avere circa 21 giorni per 1h, 83 giorni per 4h, 500 giorni per 1d

-- Aggiorna il default per nuove configurazioni
ALTER TABLE public.mkt_data_config 
ALTER COLUMN lookback_bars SET DEFAULT 500;

-- Aggiorna tutte le configurazioni esistenti a 500 bars
UPDATE public.mkt_data_config 
SET lookback_bars = 500 
WHERE lookback_bars = 100;