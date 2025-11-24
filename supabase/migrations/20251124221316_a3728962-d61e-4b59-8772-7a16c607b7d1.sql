-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));

-- Create marketplace_projects table
CREATE TABLE public.marketplace_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  published boolean DEFAULT false,
  route text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_projects ENABLE ROW LEVEL SECURITY;

-- Everyone can see published projects
CREATE POLICY "Published projects are visible to authenticated users"
  ON public.marketplace_projects
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND (published = true OR public.has_role(auth.uid(), 'owner')));

-- Only owner can manage projects
CREATE POLICY "Owner can manage all projects"
  ON public.marketplace_projects
  FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));

-- Create user_projects junction table (users choosing projects)
CREATE TABLE public.user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.marketplace_projects(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- Users can manage their own project selections
CREATE POLICY "Users can view their own projects"
  ON public.user_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add projects to their dashboard"
  ON public.user_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove projects from their dashboard"
  ON public.user_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create admin_projects junction table (admin access to specific projects)
CREATE TABLE public.admin_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.marketplace_projects(id) ON DELETE CASCADE NOT NULL,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE public.admin_projects ENABLE ROW LEVEL SECURITY;

-- Only owner can manage admin project access
CREATE POLICY "Owner can manage admin project access"
  ON public.admin_projects
  FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));

-- Admins can see which projects they have access to
CREATE POLICY "Admins can view their project access"
  ON public.admin_projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_marketplace_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketplace_projects_updated_at
  BEFORE UPDATE ON public.marketplace_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_projects_updated_at();

-- Trigger to automatically assign owner role to +34625976744
CREATE OR REPLACE FUNCTION public.assign_owner_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the owner's phone number from profiles
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = NEW.id 
    AND phone_number = '+34625976744'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Assign user role to everyone else
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_owner_role();

-- Also check existing users and assign owner role if needed
DO $$
DECLARE
  owner_user_id uuid;
BEGIN
  -- Find the owner user by phone number
  SELECT user_id INTO owner_user_id
  FROM public.profiles
  WHERE phone_number = '+34625976744'
  LIMIT 1;
  
  -- If found, assign owner role
  IF owner_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (owner_user_id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;