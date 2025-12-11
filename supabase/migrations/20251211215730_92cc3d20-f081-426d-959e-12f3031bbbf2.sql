-- Fix 1: Add INSERT policy for profiles table (defense-in-depth)
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Tighten overly permissive policies on dispatch_agents_state
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage agents state" ON public.dispatch_agents_state;

-- Create a more restrictive policy for admin/owner access
CREATE POLICY "Admins can manage agents state" 
ON public.dispatch_agents_state 
FOR ALL 
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Tighten overly permissive policies on dispatch_intermediate_results
DROP POLICY IF EXISTS "Service role can manage all intermediate results" ON public.dispatch_intermediate_results;

CREATE POLICY "Admins can manage intermediate results" 
ON public.dispatch_intermediate_results 
FOR ALL 
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 4: Tighten overly permissive policies on user_credits
DROP POLICY IF EXISTS "Service role can manage all credits" ON public.user_credits;

CREATE POLICY "Admins can manage all credits" 
ON public.user_credits 
FOR ALL 
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 5: Tighten overly permissive policies on agent_messages
DROP POLICY IF EXISTS "Service role can manage all agent messages" ON public.agent_messages;

CREATE POLICY "Admins can manage agent messages" 
ON public.agent_messages 
FOR ALL 
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 6: Tighten overly permissive policies on mkt_data_results
DROP POLICY IF EXISTS "Service role can manage all mkt data results" ON public.mkt_data_results;

CREATE POLICY "Admins can manage mkt data results" 
ON public.mkt_data_results 
FOR ALL 
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));