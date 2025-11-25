-- Enable realtime for dispatch_jobs table
ALTER TABLE public.dispatch_jobs REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_jobs;