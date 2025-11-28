-- Add AI Art project to marketplace
INSERT INTO marketplace_projects (name, description, icon, route, published)
VALUES (
  'AI Art',
  'Create stunning images and videos with AI',
  'Palette',
  '/ai-art',
  true
);

-- Create ai_art_content table (separate from ai_social_content)
CREATE TABLE ai_art_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  media_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_art_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own content"
  ON ai_art_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content"
  ON ai_art_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content"
  ON ai_art_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content"
  ON ai_art_content FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_ai_art_content_user_id ON ai_art_content(user_id);
CREATE INDEX idx_ai_art_content_created_at ON ai_art_content(created_at DESC);