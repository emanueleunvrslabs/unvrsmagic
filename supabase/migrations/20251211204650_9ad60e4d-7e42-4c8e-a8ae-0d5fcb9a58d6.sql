-- Create client_emails table for email communication history
CREATE TABLE public.client_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'failed', 'received')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own client emails" 
ON public.client_emails 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create client emails" 
ON public.client_emails 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client emails" 
ON public.client_emails 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client emails" 
ON public.client_emails 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_emails_updated_at
BEFORE UPDATE ON public.client_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_client_emails_client_id ON public.client_emails(client_id);
CREATE INDEX idx_client_emails_contact_id ON public.client_emails(contact_id);
CREATE INDEX idx_client_emails_user_id ON public.client_emails(user_id);
CREATE INDEX idx_client_emails_direction ON public.client_emails(direction);
CREATE INDEX idx_client_emails_created_at ON public.client_emails(created_at DESC);