// Type definitions for Edge Function responses

/**
 * OAuth response from social media OAuth edge functions
 */
export interface OAuthResponse {
  authUrl?: string;
  error?: string;
  success?: boolean;
}

/**
 * Social connection stored in api_keys table
 */
export interface SocialConnection {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * YouTube connection with parsed channel data
 */
export interface YouTubeConnection extends SocialConnection {
  channelTitle?: string;
}

/**
 * LinkedIn connection with parsed profile data
 */
export interface LinkedInConnection extends SocialConnection {
  name?: string;
}

/**
 * Instagram connection
 */
export interface InstagramConnection extends SocialConnection {}

/**
 * Workflow schedule configuration
 */
export interface WorkflowScheduleConfig {
  frequency?: string;
  times?: string[];
  days?: string[];
  mode?: string;
  aspect_ratio?: string;
  resolution?: string;
  output_format?: string;
  duration?: string;
  generate_audio?: boolean;
  [key: string]: unknown;
}

/**
 * Content metadata for AI Social content
 */
export interface ContentMetadata {
  execution_type?: "scheduled" | "manual";
  workflow_id?: string;
  instagram_post_url?: string;
  linkedin_post_url?: string;
  duration?: string;
  [key: string]: unknown;
}

/**
 * API Key record from database
 */
export interface ApiKeyRecord {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * FunctionsInvokeError type for Supabase function errors
 */
export interface FunctionsInvokeError {
  message?: string;
  name?: string;
  context?: unknown;
}
