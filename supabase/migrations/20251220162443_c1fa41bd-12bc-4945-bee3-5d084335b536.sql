-- Create table for Telegram MTProto sessions
CREATE TABLE public.telegram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_name TEXT NOT NULL,
  session_string TEXT NOT NULL,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for monitored Telegram groups
CREATE TABLE public.telegram_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.telegram_sessions(id) ON DELETE CASCADE,
  telegram_group_id BIGINT NOT NULL,
  group_name TEXT,
  group_username TEXT,
  group_type TEXT DEFAULT 'group',
  member_count INT,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, telegram_group_id)
);

-- Create table for scraped members
CREATE TABLE public.telegram_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  is_bot BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, telegram_user_id)
);

-- Enable RLS
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for telegram_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.telegram_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.telegram_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.telegram_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.telegram_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for telegram_groups
CREATE POLICY "Users can view their own groups"
  ON public.telegram_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups"
  ON public.telegram_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
  ON public.telegram_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
  ON public.telegram_groups FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for telegram_members
CREATE POLICY "Users can view their own members"
  ON public.telegram_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own members"
  ON public.telegram_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own members"
  ON public.telegram_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own members"
  ON public.telegram_members FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_telegram_sessions_user_id ON public.telegram_sessions(user_id);
CREATE INDEX idx_telegram_groups_user_id ON public.telegram_groups(user_id);
CREATE INDEX idx_telegram_groups_session_id ON public.telegram_groups(session_id);
CREATE INDEX idx_telegram_members_group_id ON public.telegram_members(group_id);
CREATE INDEX idx_telegram_members_user_id ON public.telegram_members(user_id);
CREATE INDEX idx_telegram_members_username ON public.telegram_members(username);

-- Triggers for updated_at
CREATE TRIGGER update_telegram_sessions_updated_at
  BEFORE UPDATE ON public.telegram_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telegram_groups_updated_at
  BEFORE UPDATE ON public.telegram_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();