-- Allow anonymous users to view published projects on landing page
DROP POLICY IF EXISTS "Published projects are visible to authenticated users" ON marketplace_projects;

CREATE POLICY "Published projects are visible to everyone"
ON marketplace_projects
FOR SELECT
USING (published = true OR has_role(auth.uid(), 'owner'));
