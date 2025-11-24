-- Create tables for Ai Social project

-- Table for generated content
CREATE TABLE public.ai_social_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  prompt text NOT NULL,
  media_url text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_social_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content"
  ON public.ai_social_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content"
  ON public.ai_social_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content"
  ON public.ai_social_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content"
  ON public.ai_social_content FOR DELETE
  USING (auth.uid() = user_id);

-- Table for scheduled posts
CREATE TABLE public.ai_social_scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES public.ai_social_content(id) ON DELETE CASCADE,
  workflow_id uuid,
  scheduled_at timestamptz NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  caption text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed')),
  published_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_social_scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scheduled posts"
  ON public.ai_social_scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled posts"
  ON public.ai_social_scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts"
  ON public.ai_social_scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts"
  ON public.ai_social_scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Table for automated workflows
CREATE TABLE public.ai_social_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  content_type text NOT NULL CHECK (content_type IN ('image', 'video')),
  prompt_template text NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  schedule_config jsonb NOT NULL,
  active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_social_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflows"
  ON public.ai_social_workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows"
  ON public.ai_social_workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON public.ai_social_workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON public.ai_social_workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_ai_social_content_updated_at
  BEFORE UPDATE ON public.ai_social_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_social_scheduled_posts_updated_at
  BEFORE UPDATE ON public.ai_social_scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_social_workflows_updated_at
  BEFORE UPDATE ON public.ai_social_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();