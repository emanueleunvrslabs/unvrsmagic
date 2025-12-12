
-- UNVRS Agent OS - Phase 1 Database Schema

-- Table 1: unvrs_conversations - Tracks all omnichannel conversations
CREATE TABLE public.unvrs_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'instagram', 'linkedin', 'phone', 'email')),
    contact_identifier TEXT NOT NULL,
    contact_name TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id UUID,
    current_agent TEXT DEFAULT 'brain',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 2: unvrs_leads - Leads not yet converted to clients
CREATE TABLE public.unvrs_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    phone TEXT,
    email TEXT,
    name TEXT,
    company TEXT,
    source_channel TEXT,
    source_conversation_id UUID REFERENCES public.unvrs_conversations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    first_contact_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    qualified_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key from conversations to leads after leads table exists
ALTER TABLE public.unvrs_conversations 
ADD CONSTRAINT fk_unvrs_conversations_lead 
FOREIGN KEY (lead_id) REFERENCES public.unvrs_leads(id) ON DELETE SET NULL;

-- Table 3: unvrs_project_briefs - Requirements collected by INTAKE agent
CREATE TABLE public.unvrs_project_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.unvrs_leads(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.unvrs_conversations(id) ON DELETE SET NULL,
    project_type TEXT,
    requirements JSONB DEFAULT '{}'::jsonb,
    budget_range TEXT,
    timeline_preference TEXT,
    collected_steps JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'complete', 'approved', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 4: unvrs_project_quotes - Generated quotes
CREATE TABLE public.unvrs_project_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    brief_id UUID REFERENCES public.unvrs_project_briefs(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.unvrs_leads(id) ON DELETE SET NULL,
    quote_number TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    timeline_days INTEGER,
    assumptions JSONB DEFAULT '[]'::jsonb,
    risks JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    valid_until TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 5: unvrs_agent_sessions - Active sessions for each agent
CREATE TABLE public.unvrs_agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('brain', 'switch', 'hlo', 'intake', 'quote', 'deck', 'call', 'social_brain', 'social_publisher', 'social_reply')),
    agent_instance_id TEXT,
    conversation_id UUID REFERENCES public.unvrs_conversations(id) ON DELETE CASCADE,
    state JSONB DEFAULT '{}'::jsonb,
    context JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 6: unvrs_messages - Message history for conversations
CREATE TABLE public.unvrs_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    conversation_id UUID NOT NULL REFERENCES public.unvrs_conversations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'voice', 'image', 'document', 'video')),
    content TEXT,
    media_url TEXT,
    transcription TEXT,
    processed_by_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.unvrs_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unvrs_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unvrs_project_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unvrs_project_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unvrs_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unvrs_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for unvrs_conversations
CREATE POLICY "Owner can manage all conversations" ON public.unvrs_conversations
FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Service role full access conversations" ON public.unvrs_conversations
FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for unvrs_leads
CREATE POLICY "Owner can manage all leads" ON public.unvrs_leads
FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Service role full access leads" ON public.unvrs_leads
FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for unvrs_project_briefs
CREATE POLICY "Owner can manage all briefs" ON public.unvrs_project_briefs
FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Service role full access briefs" ON public.unvrs_project_briefs
FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for unvrs_project_quotes
CREATE POLICY "Owner can manage all quotes" ON public.unvrs_project_quotes
FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Service role full access quotes" ON public.unvrs_project_quotes
FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for unvrs_agent_sessions
CREATE POLICY "Owner can view agent sessions" ON public.unvrs_agent_sessions
FOR SELECT USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Service role full access sessions" ON public.unvrs_agent_sessions
FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for unvrs_messages
CREATE POLICY "Owner can view all messages" ON public.unvrs_messages
FOR SELECT USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Service role full access messages" ON public.unvrs_messages
FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_unvrs_conversations_channel ON public.unvrs_conversations(channel);
CREATE INDEX idx_unvrs_conversations_contact ON public.unvrs_conversations(contact_identifier);
CREATE INDEX idx_unvrs_conversations_status ON public.unvrs_conversations(status);
CREATE INDEX idx_unvrs_leads_status ON public.unvrs_leads(status);
CREATE INDEX idx_unvrs_leads_phone ON public.unvrs_leads(phone);
CREATE INDEX idx_unvrs_leads_email ON public.unvrs_leads(email);
CREATE INDEX idx_unvrs_messages_conversation ON public.unvrs_messages(conversation_id);
CREATE INDEX idx_unvrs_agent_sessions_conversation ON public.unvrs_agent_sessions(conversation_id);
CREATE INDEX idx_unvrs_agent_sessions_type ON public.unvrs_agent_sessions(agent_type);

-- Triggers for updated_at
CREATE TRIGGER update_unvrs_conversations_updated_at
BEFORE UPDATE ON public.unvrs_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unvrs_leads_updated_at
BEFORE UPDATE ON public.unvrs_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unvrs_project_briefs_updated_at
BEFORE UPDATE ON public.unvrs_project_briefs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unvrs_project_quotes_updated_at
BEFORE UPDATE ON public.unvrs_project_quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
