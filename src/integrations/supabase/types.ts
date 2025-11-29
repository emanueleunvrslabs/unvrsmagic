export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_projects: {
        Row: {
          granted_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "marketplace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_alerts: {
        Row: {
          agent_name: string
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          agent_name: string
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          severity: string
          title: string
          user_id: string
        }
        Update: {
          agent_name?: string
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          action: string | null
          agent_name: string
          created_at: string | null
          duration_ms: number | null
          id: string
          log_level: string
          message: string
          metadata: Json | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          agent_name: string
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          log_level: string
          message: string
          metadata?: Json | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          agent_name?: string
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          log_level?: string
          message?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          created_at: string | null
          id: string
          message_type: string
          payload: Json
          priority: number | null
          processed_at: string | null
          receiver_agent: string
          sender_agent: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_type: string
          payload: Json
          priority?: number | null
          processed_at?: string | null
          receiver_agent: string
          sender_agent: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_type?: string
          payload?: Json
          priority?: number | null
          processed_at?: string | null
          receiver_agent?: string
          sender_agent?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_prompts: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          prompt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          prompt: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          prompt?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_state: {
        Row: {
          agent_name: string
          created_at: string | null
          id: string
          last_error: string | null
          last_execution: string | null
          performance_metrics: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_execution?: string | null
          performance_metrics?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_execution?: string | null
          performance_metrics?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_art_content: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          media_url: string | null
          metadata: Json | null
          prompt: string
          status: string
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          prompt: string
          status?: string
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          prompt?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_avatars: {
        Row: {
          closing_script: string | null
          created_at: string
          description: string | null
          heygen_avatar_id: string
          id: string
          knowledge_base: Json | null
          name: string
          opening_script: string | null
          personality: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          voice_id: string | null
        }
        Insert: {
          closing_script?: string | null
          created_at?: string
          description?: string | null
          heygen_avatar_id: string
          id?: string
          knowledge_base?: Json | null
          name: string
          opening_script?: string | null
          personality?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          voice_id?: string | null
        }
        Update: {
          closing_script?: string | null
          created_at?: string
          description?: string | null
          heygen_avatar_id?: string
          id?: string
          knowledge_base?: Json | null
          name?: string
          opening_script?: string | null
          personality?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      ai_live_comments: {
        Row: {
          comment_text: string
          commenter_id: string | null
          commenter_name: string | null
          created_at: string
          id: string
          platform: string
          responded_at: string | null
          response_audio_url: string | null
          response_text: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          commenter_id?: string | null
          commenter_name?: string | null
          created_at?: string
          id?: string
          platform: string
          responded_at?: string | null
          response_audio_url?: string | null
          response_text?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          commenter_id?: string | null
          commenter_name?: string | null
          created_at?: string
          id?: string
          platform?: string
          responded_at?: string | null
          response_audio_url?: string | null
          response_text?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_live_comments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_live_products: {
        Row: {
          auto_promote: boolean | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number | null
          product_url: string | null
          promo_script: string | null
          promote_interval_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_promote?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          product_url?: string | null
          promo_script?: string | null
          promote_interval_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_promote?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          product_url?: string | null
          promo_script?: string | null
          promote_interval_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_live_sessions: {
        Row: {
          avatar_id: string | null
          created_at: string
          ended_at: string | null
          heygen_session_id: string | null
          id: string
          metadata: Json | null
          platforms: string[] | null
          started_at: string | null
          status: string
          total_comments: number | null
          total_responses: number | null
          updated_at: string
          user_id: string
          viewer_count: number | null
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          ended_at?: string | null
          heygen_session_id?: string | null
          id?: string
          metadata?: Json | null
          platforms?: string[] | null
          started_at?: string | null
          status?: string
          total_comments?: number | null
          total_responses?: number | null
          updated_at?: string
          user_id: string
          viewer_count?: number | null
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          ended_at?: string | null
          heygen_session_id?: string | null
          id?: string
          metadata?: Json | null
          platforms?: string[] | null
          started_at?: string | null
          status?: string
          total_comments?: number | null
          total_responses?: number | null
          updated_at?: string
          user_id?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_live_sessions_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "ai_avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_content: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          media_url: string | null
          metadata: Json | null
          prompt: string
          status: string
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          prompt: string
          status?: string
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          prompt?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_social_scheduled_posts: {
        Row: {
          caption: string | null
          content_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          platforms: string[]
          published_at: string | null
          scheduled_at: string
          status: string
          updated_at: string | null
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          caption?: string | null
          content_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          platforms?: string[]
          published_at?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string | null
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          caption?: string | null
          content_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          platforms?: string[]
          published_at?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_scheduled_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_social_content"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_workflows: {
        Row: {
          active: boolean | null
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          platforms: string[]
          prompt_template: string
          schedule_config: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          platforms?: string[]
          prompt_template: string
          schedule_config: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          platforms?: string[]
          prompt_template?: string
          schedule_config?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          owner_id: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          owner_id?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          owner_id?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          whatsapp_number: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          whatsapp_number: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string
          company_name: string
          country: string
          created_at: string | null
          id: string
          postal_code: string
          street: string
          updated_at: string | null
          user_id: string
          vat_number: string
        }
        Insert: {
          city: string
          company_name: string
          country: string
          created_at?: string | null
          id?: string
          postal_code: string
          street: string
          updated_at?: string | null
          user_id?: string
          vat_number: string
        }
        Update: {
          city?: string
          company_name?: string
          country?: string
          created_at?: string | null
          id?: string
          postal_code?: string
          street?: string
          updated_at?: string | null
          user_id?: string
          vat_number?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          content_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          stripe_payment_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          content_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          stripe_payment_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          content_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          stripe_payment_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_social_content"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_agents_state: {
        Row: {
          agent_name: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_id: string | null
          progress: number | null
          result: Json | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_id?: string | null
          progress?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_id?: string | null
          progress?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_agents_state_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "dispatch_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_files: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string | null
          id: string
          metadata: Json | null
          month_reference: string | null
          status: string | null
          updated_at: string | null
          upload_source: string | null
          user_id: string
          zone_code: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          month_reference?: string | null
          status?: string | null
          updated_at?: string | null
          upload_source?: string | null
          user_id: string
          zone_code?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          month_reference?: string | null
          status?: string | null
          updated_at?: string | null
          upload_source?: string | null
          user_id?: string
          zone_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_files_zone_code_fkey"
            columns: ["zone_code"]
            isOneToOne: false
            referencedRelation: "dispatch_zones"
            referencedColumns: ["code"]
          },
        ]
      }
      dispatch_intermediate_results: {
        Row: {
          created_at: string | null
          data: Json
          error_message: string | null
          file_id: string | null
          id: string
          job_id: string | null
          processing_time_ms: number | null
          result_type: string
          status: string | null
          updated_at: string | null
          user_id: string
          zone_code: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          error_message?: string | null
          file_id?: string | null
          id?: string
          job_id?: string | null
          processing_time_ms?: number | null
          result_type: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          zone_code?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          error_message?: string | null
          file_id?: string | null
          id?: string
          job_id?: string | null
          processing_time_ms?: number | null
          result_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          zone_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_intermediate_results_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "dispatch_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_intermediate_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "dispatch_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_jobs: {
        Row: {
          agents_state: Json | null
          completed_at: string | null
          created_at: string | null
          current_agent: string | null
          dispatch_month: string
          errors: Json | null
          historical_month: string
          id: string
          progress: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          warnings: Json | null
          zone_code: string
        }
        Insert: {
          agents_state?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_agent?: string | null
          dispatch_month: string
          errors?: Json | null
          historical_month: string
          id?: string
          progress?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          warnings?: Json | null
          zone_code: string
        }
        Update: {
          agents_state?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_agent?: string | null
          dispatch_month?: string
          errors?: Json | null
          historical_month?: string
          id?: string
          progress?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          warnings?: Json | null
          zone_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_jobs_zone_code_fkey"
            columns: ["zone_code"]
            isOneToOne: false
            referencedRelation: "dispatch_zones"
            referencedColumns: ["code"]
          },
        ]
      }
      dispatch_pods: {
        Row: {
          annual_consumption: number | null
          created_at: string | null
          distributor: string | null
          id: string
          metadata: Json | null
          meter_type: string
          monthly_consumption: number | null
          pod_code: string
          updated_at: string | null
          user_id: string
          zone_code: string
        }
        Insert: {
          annual_consumption?: number | null
          created_at?: string | null
          distributor?: string | null
          id?: string
          metadata?: Json | null
          meter_type: string
          monthly_consumption?: number | null
          pod_code: string
          updated_at?: string | null
          user_id: string
          zone_code: string
        }
        Update: {
          annual_consumption?: number | null
          created_at?: string | null
          distributor?: string | null
          id?: string
          metadata?: Json | null
          meter_type?: string
          monthly_consumption?: number | null
          pod_code?: string
          updated_at?: string | null
          user_id?: string
          zone_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_pods_zone_code_fkey"
            columns: ["zone_code"]
            isOneToOne: false
            referencedRelation: "dispatch_zones"
            referencedColumns: ["code"]
          },
        ]
      }
      dispatch_results: {
        Row: {
          created_at: string | null
          curve_96_values: Json
          dispatch_month: string
          id: string
          ip_curve: Json | null
          job_id: string | null
          lp_curve: Json | null
          metadata: Json | null
          o_curve: Json | null
          pods_with_data: number | null
          pods_without_data: number | null
          quality_score: number | null
          total_pods: number | null
          updated_at: string | null
          user_id: string
          zone_code: string
        }
        Insert: {
          created_at?: string | null
          curve_96_values: Json
          dispatch_month: string
          id?: string
          ip_curve?: Json | null
          job_id?: string | null
          lp_curve?: Json | null
          metadata?: Json | null
          o_curve?: Json | null
          pods_with_data?: number | null
          pods_without_data?: number | null
          quality_score?: number | null
          total_pods?: number | null
          updated_at?: string | null
          user_id: string
          zone_code: string
        }
        Update: {
          created_at?: string | null
          curve_96_values?: Json
          dispatch_month?: string
          id?: string
          ip_curve?: Json | null
          job_id?: string | null
          lp_curve?: Json | null
          metadata?: Json | null
          o_curve?: Json | null
          pods_with_data?: number | null
          pods_without_data?: number | null
          quality_score?: number | null
          total_pods?: number | null
          updated_at?: string | null
          user_id?: string
          zone_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "dispatch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_results_zone_code_fkey"
            columns: ["zone_code"]
            isOneToOne: false
            referencedRelation: "dispatch_zones"
            referencedColumns: ["code"]
          },
        ]
      }
      dispatch_zones: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      exchange_keys: {
        Row: {
          api_key: string
          api_secret: string | null
          created_at: string
          exchange: string
          id: string
          passphrase: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_secret?: string | null
          created_at?: string
          exchange: string
          id?: string
          passphrase?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_secret?: string | null
          created_at?: string
          exchange?: string
          id?: string
          passphrase?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_projects: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          published: boolean | null
          route: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          published?: boolean | null
          route: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          published?: boolean | null
          route?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mkt_data_config: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          lookback_bars: number
          market_types: string[]
          symbols: string[]
          timeframes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          lookback_bars?: number
          market_types?: string[]
          symbols?: string[]
          timeframes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          lookback_bars?: number
          market_types?: string[]
          symbols?: string[]
          timeframes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mkt_data_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          data_sources: Json | null
          id: string
          market_type: string
          notes: string | null
          ohlcv: Json
          symbol: string
          timeframe: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          id?: string
          market_type: string
          notes?: string | null
          ohlcv: Json
          symbol: string
          timeframe: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          id?: string
          market_type?: string
          notes?: string | null
          ohlcv?: Json
          symbol?: string
          timeframe?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          failed_attempts: number
          id: string
          phone_number: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          failed_attempts?: number
          id?: string
          phone_number: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          failed_attempts?: number
          id?: string
          phone_number?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone_number: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_number: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_number?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      uploaded_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_extracted: boolean | null
          metadata: Json | null
          original_name: string
          parent_zip_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_extracted?: boolean | null
          metadata?: Json | null
          original_name: string
          parent_zip_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_extracted?: boolean | null
          metadata?: Json | null
          original_name?: string
          parent_zip_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_purchased: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          added_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "marketplace_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          client_id: string
          contact_id: string
          created_at: string | null
          direction: string
          id: string
          message_id: string | null
          message_text: string
          phone_number: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          contact_id: string
          created_at?: string | null
          direction: string
          id?: string
          message_id?: string | null
          message_text: string
          phone_number: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          contact_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          message_id?: string | null
          message_text?: string
          phone_number?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_stripe_payment_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      deduct_credits: {
        Args: {
          p_amount: number
          p_content_id?: string
          p_description: string
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "user"],
    },
  },
} as const
