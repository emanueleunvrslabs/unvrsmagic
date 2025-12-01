CREATE TABLE client_project_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_project_id uuid REFERENCES client_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  content_type text NOT NULL,
  prompt_template text NOT NULL,
  platforms text[],
  schedule_config jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_project_workflows ENABLE ROW LEVEL SECURITY;