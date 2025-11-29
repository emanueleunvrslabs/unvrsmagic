-- Fix deduct_credits function to record negative amounts for owner/admin generation transactions
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount numeric, p_description text, p_content_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance numeric;
BEGIN
  -- Owner and admin users have unlimited credits - skip deduction
  IF public.has_role(p_user_id, 'owner') OR public.has_role(p_user_id, 'admin') THEN
    -- Still log the transaction for tracking, but as negative amount (spent)
    INSERT INTO credit_transactions (user_id, amount, type, description, content_id)
    VALUES (p_user_id, -p_amount, 'generation', p_description, p_content_id);
    RETURN true;
  END IF;

  -- For regular users, check balance and deduct
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no credits record exists or insufficient balance, return false
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN false;
  END IF;

  -- Deduct credits
  UPDATE user_credits
  SET 
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log transaction as negative (spent)
  INSERT INTO credit_transactions (user_id, amount, type, description, content_id)
  VALUES (p_user_id, -p_amount, 'generation', p_description, p_content_id);

  RETURN true;
END;
$function$;