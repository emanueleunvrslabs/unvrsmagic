-- Fix NKMT orchestrator cron job
-- Delete old broken job
SELECT cron.unschedule(3);

-- Create new working job
SELECT cron.schedule(
  'nkmt-orchestrator-fixed',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://uzsxrvwdfdmucgoshpni.supabase.co/functions/v1/nkmt-orchestrator',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6c3hydndkZmRtdWNnb3NocG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzAzNDUsImV4cCI6MjA3ODkwNjM0NX0.2wSaN-X4IjIRwv7MzqPOF8T7l_PmM4Q2w9hCNXdvzuY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);