-- Create cron job for NKMT orchestrator (runs every 5 minutes)
SELECT cron.schedule(
  'nkmt-orchestrator-cron',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:=current_setting('app.settings.supabase_url') || '/functions/v1/nkmt-orchestrator',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.supabase_service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Create cron job for MKT.DATA scheduler (runs every 5 minutes)
SELECT cron.schedule(
  'mkt-data-scheduler-cron',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:=current_setting('app.settings.supabase_url') || '/functions/v1/mkt-data-scheduler',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.supabase_service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Set Supabase configuration (these will be set automatically by Supabase)
-- This is just documentation of what needs to be configured
DO $$
BEGIN
  -- These settings need to be configured in Supabase dashboard
  -- Settings -> API -> Configuration
  -- They are automatically available in pg_cron jobs
  RAISE NOTICE 'Make sure app.settings.supabase_url and app.settings.supabase_service_role_key are configured';
END $$;