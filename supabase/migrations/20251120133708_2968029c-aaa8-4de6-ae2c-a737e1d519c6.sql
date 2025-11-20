-- Add cron jobs for AI agents

-- SIGNAL.MAKER: runs every 10 minutes
SELECT cron.schedule(
  'signal-maker-schedule',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://uzsxrvwdfdmucgoshpni.supabase.co/functions/v1/signal-maker-agent',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6c3hydndkZmRtdWNnb3NocG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzAzNDUsImV4cCI6MjA3ODkwNjM0NX0.2wSaN-X4IjIRwv7MzqPOF8T7l_PmM4Q2w9hCNXdvzuY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);

-- MARKET.MODELER: runs every 15 minutes
SELECT cron.schedule(
  'market-modeler-schedule',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://uzsxrvwdfdmucgoshpni.supabase.co/functions/v1/market-modeler-agent',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6c3hydndkZmRtdWNnb3NocG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzAzNDUsImV4cCI6MjA3ODkwNjM0NX0.2wSaN-X4IjIRwv7MzqPOF8T7l_PmM4Q2w9hCNXdvzuY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);

-- RISK.MGR: runs every 5 minutes (more frequent for risk monitoring)
SELECT cron.schedule(
  'risk-manager-schedule',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://uzsxrvwdfdmucgoshpni.supabase.co/functions/v1/risk-manager-agent',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6c3hydndkZmRtdWNnb3NocG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzAzNDUsImV4cCI6MjA3ODkwNjM0NX0.2wSaN-X4IjIRwv7MzqPOF8T7l_PmM4Q2w9hCNXdvzuY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);