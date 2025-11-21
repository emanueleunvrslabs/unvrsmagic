-- Remove duplicate cron jobs for mkt-data-scheduler
-- Keep only the hourly job (jobid: 9)
SELECT cron.unschedule(2);
SELECT cron.unschedule(4);