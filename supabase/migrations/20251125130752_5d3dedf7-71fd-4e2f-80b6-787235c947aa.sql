-- Add unique constraint on agent_prompts to prevent duplicate entries
ALTER TABLE public.agent_prompts
ADD CONSTRAINT agent_prompts_user_agent_unique UNIQUE (user_id, agent_id);