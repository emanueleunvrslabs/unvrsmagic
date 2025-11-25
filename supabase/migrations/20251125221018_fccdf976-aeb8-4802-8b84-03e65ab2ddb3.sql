-- Create user_credits table to track user balances
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_purchased DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_transactions table for transaction history
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'generation', 'refund', 'adjustment')),
  description TEXT,
  content_id UUID REFERENCES public.ai_social_content(id),
  stripe_payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits"
  ON public.user_credits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions"
  ON public.credit_transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.user_id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create credits record when profile is created
CREATE TRIGGER on_profile_created_init_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_credits();

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_content_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance DECIMAL;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.user_credits
  SET 
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, content_id)
  VALUES (p_user_id, -p_amount, 'generation', p_description, p_content_id);
  
  RETURN TRUE;
END;
$$;

-- Function to add credits after purchase
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount DECIMAL,
  p_stripe_payment_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Initialize credits if not exists
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add credits
  UPDATE public.user_credits
  SET 
    balance = balance + p_amount,
    total_purchased = total_purchased + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, stripe_payment_id)
  VALUES (p_user_id, p_amount, 'purchase', 'Credit purchase', p_stripe_payment_id);
  
  RETURN TRUE;
END;
$$;