-- Create audit_logs table for security monitoring
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owners can view audit logs
CREATE POLICY "Owners can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'owner'::app_role));

-- System can insert audit logs (no user restriction for inserts)
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Add audit triggers for sensitive tables

-- Credit operations
CREATE TRIGGER audit_user_credits
AFTER INSERT OR UPDATE OR DELETE ON public.user_credits
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_credit_transactions
AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Client data
CREATE TRIGGER audit_clients
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_client_contacts
AFTER INSERT OR UPDATE OR DELETE ON public.client_contacts
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Admin actions
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_marketplace_projects
AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_projects
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_api_keys
AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();