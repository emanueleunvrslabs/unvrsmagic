-- Create ai_avatars table for storing user avatar configurations
CREATE TABLE public.ai_avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  heygen_avatar_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  voice_id TEXT,
  personality TEXT DEFAULT 'friendly',
  knowledge_base JSONB DEFAULT '{}',
  opening_script TEXT,
  closing_script TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_live_sessions table for tracking live streaming sessions
CREATE TABLE public.ai_live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avatar_id UUID REFERENCES public.ai_avatars(id) ON DELETE CASCADE,
  heygen_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  platforms TEXT[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  viewer_count INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_live_products table for products to promote during live
CREATE TABLE public.ai_live_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  image_url TEXT,
  product_url TEXT,
  promo_script TEXT,
  auto_promote BOOLEAN DEFAULT false,
  promote_interval_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_live_comments table for logging comments and responses
CREATE TABLE public.ai_live_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.ai_live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  commenter_name TEXT,
  commenter_id TEXT,
  comment_text TEXT NOT NULL,
  response_text TEXT,
  response_audio_url TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_live_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_live_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_avatars
CREATE POLICY "Users can view their own avatars" ON public.ai_avatars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own avatars" ON public.ai_avatars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatars" ON public.ai_avatars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avatars" ON public.ai_avatars
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_live_sessions
CREATE POLICY "Users can view their own sessions" ON public.ai_live_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON public.ai_live_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.ai_live_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.ai_live_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_live_products
CREATE POLICY "Users can view their own products" ON public.ai_live_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products" ON public.ai_live_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON public.ai_live_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON public.ai_live_products
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_live_comments
CREATE POLICY "Users can view their own comments" ON public.ai_live_comments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own comments" ON public.ai_live_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.ai_live_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_ai_avatars_updated_at
  BEFORE UPDATE ON public.ai_avatars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_live_sessions_updated_at
  BEFORE UPDATE ON public.ai_live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_live_products_updated_at
  BEFORE UPDATE ON public.ai_live_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();