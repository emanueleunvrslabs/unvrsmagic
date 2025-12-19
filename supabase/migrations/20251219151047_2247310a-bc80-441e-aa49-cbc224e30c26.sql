-- Add Memora to marketplace_projects
INSERT INTO marketplace_projects (name, description, icon, route, published, coming_soon)
VALUES ('Memora', 'Ricorda i compleanni delle persone care', 'Cake', '/memora', true, false);

-- Create memora_contacts table
CREATE TABLE public.memora_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memora_contacts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can insert memora contacts" ON public.memora_contacts
  FOR INSERT WITH CHECK (true);

-- Only owner can read their contacts
CREATE POLICY "Users can view their own memora contacts" ON public.memora_contacts
  FOR SELECT USING (auth.uid() = user_id);

-- Only owner can delete their contacts
CREATE POLICY "Users can delete their own memora contacts" ON public.memora_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.memora_contacts;