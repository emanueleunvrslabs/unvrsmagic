-- Enable realtime for client_emails table
ALTER TABLE public.client_emails REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_emails;