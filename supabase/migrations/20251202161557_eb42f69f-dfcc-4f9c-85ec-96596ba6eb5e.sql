-- Create table to store email preferences for ARERA deliberations
CREATE TABLE public.arera_email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.arera_email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can view their own email preferences"
ON public.arera_email_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences"
ON public.arera_email_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
ON public.arera_email_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email preferences"
ON public.arera_email_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Service role can read all for sending emails
CREATE POLICY "Service role can read all preferences"
ON public.arera_email_preferences
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_arera_email_preferences_updated_at
BEFORE UPDATE ON public.arera_email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();