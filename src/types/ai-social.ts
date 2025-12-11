// AI Social TypeScript Interfaces
import type { Json } from "@/integrations/supabase/types";

export interface ScheduleConfig {
  generation_mode?: string;
  aspect_ratio?: string;
  resolution?: string;
  output_format?: string;
  image_urls?: string[];
  reference_image_url?: string;
  first_frame_url?: string;
  last_frame_url?: string;
  first_frame_image?: string;
  last_frame_image?: string;
  duration?: string;
  generate_audio?: boolean;
  frequency: string;
  times: string[];
  days: string[];
  time?: string; // Legacy single time format
  [key: string]: Json | undefined; // Allow Json compatibility
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  content_type: string;
  prompt_template: string;
  platforms: string[];
  schedule_config: Json;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
}

export interface ConnectedAccount {
  provider: string;
  owner_id: string | null;
}

export interface AiSocialContent {
  id: string;
  user_id: string;
  type: "image" | "video";
  title: string;
  prompt: string;
  status: "pending" | "generating" | "completed" | "failed";
  media_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  metadata: ContentMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface ContentMetadata {
  mode?: string;
  aspect_ratio?: string;
  resolution?: string;
  output_format?: string;
  duration?: string;
  generate_audio?: boolean;
  [key: string]: unknown;
}

export interface ScheduledPost {
  id: string;
  workflow_id: string | null;
  content_id: string | null;
  user_id: string;
  scheduled_at: string;
  status: "scheduled" | "processing" | "published" | "failed";
  platforms: string[];
  caption: string | null;
  error_message: string | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type WorkflowContentType = "image" | "video";

export type GenerationMode = 
  | "text-to-image" 
  | "image-to-image" 
  | "text-to-video" 
  | "image-to-video" 
  | "reference-to-video" 
  | "first-last-frame";

export type ScheduleFrequency = "once" | "daily" | "weekly" | "custom";

// Helper function to parse schedule config from Json
export function parseScheduleConfig(config: Json): ScheduleConfig {
  if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
    return config as unknown as ScheduleConfig;
  }
  return {
    frequency: 'daily',
    times: ['09:00'],
    days: ['monday', 'wednesday', 'friday']
  };
}
