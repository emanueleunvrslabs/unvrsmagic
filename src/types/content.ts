// Content Generation TypeScript Interfaces

import type { Json } from "@/integrations/supabase/types";

export interface ContentMetadata {
  mode?: string;
  aspect_ratio?: string;
  resolution?: string;
  output_format?: string;
  duration?: string;
  generate_audio?: boolean;
  [key: string]: unknown;
}

export interface ContentItem {
  id: string;
  user_id: string;
  title: string;
  type: string;
  status: string;
  prompt: string;
  media_url: string | null;
  thumbnail_url?: string | null;
  error_message?: string | null;
  metadata?: Json | null;
  created_at: string;
  updated_at?: string;
}

export interface AgentMessagePayload {
  action?: string;
  data?: Record<string, unknown>;
  error?: string;
  result?: unknown;
  [key: string]: unknown;
}
