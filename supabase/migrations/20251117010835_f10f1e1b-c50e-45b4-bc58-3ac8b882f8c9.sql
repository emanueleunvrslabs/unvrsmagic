-- Create table for exchange API keys
CREATE TABLE public.exchange_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exchange TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exchange)
);

-- Enable Row Level Security
ALTER TABLE public.exchange_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own exchange keys" 
ON public.exchange_keys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exchange keys" 
ON public.exchange_keys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exchange keys" 
ON public.exchange_keys 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exchange keys" 
ON public.exchange_keys 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exchange_keys_updated_at
BEFORE UPDATE ON public.exchange_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();