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
      arera_delibere: {
        Row: {
          category: string | null
          created_at: string
          delibera_code: string
          description: string | null
          detail_url: string | null
          error_message: string | null
          files: Json | null
          id: string
          publication_date: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          delibera_code: string
          description?: string | null
          detail_url?: string | null
          error_message?: string | null
          files?: Json | null
          id?: string
          publication_date?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          delibera_code?: string
          description?: string | null
          detail_url?: string | null
          error_message?: string | null
          files?: Json | null
          id?: string
          publication_date?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      arera_email_preferences: {
        Row: {
          active: boolean
          categories: string[]
          created_at: string
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          categories?: string[]
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          categories?: string[]
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
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
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_emails: {
        Row: {
          attachments: Json | null
          body: string
          client_id: string
          contact_id: string | null
          created_at: string
          direction: string
          id: string
          read_at: string | null
          recipient_email: string
          sender_email: string
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          client_id: string
          contact_id?: string | null
          created_at?: string
          direction: string
          id?: string
          read_at?: string | null
          recipient_email: string
          sender_email: string
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          client_id?: string
          contact_id?: string | null
          created_at?: string
          direction?: string
          id?: string
          read_at?: string | null
          recipient_email?: string
          sender_email?: string
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_emails_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_kanban_tasks: {
        Row: {
          client_id: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_kanban_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_project_workflows: {
        Row: {
          active: boolean | null
          client_project_id: string | null
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          platforms: string[] | null
          prompt_template: string
          schedule_config: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          client_project_id?: string | null
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          platforms?: string[] | null
          prompt_template: string
          schedule_config?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          client_project_id?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          platforms?: string[] | null
          prompt_template?: string
          schedule_config?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_project_workflows_client_project_id_fkey"
            columns: ["client_project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          project_name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          project_name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          project_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_todos: {
        Row: {
          client_id: string
          completed: boolean
          created_at: string
          id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          completed?: boolean
          created_at?: string
          id?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          completed?: boolean
          created_at?: string
          id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_todos_client_id_fkey"
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
      demo_bookings: {
        Row: {
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          meeting_link: string | null
          notes: string | null
          project_type: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          notes?: string | null
          project_type?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          notes?: string | null
          project_type?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
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
          coming_soon: boolean | null
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
          coming_soon?: boolean | null
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
          coming_soon?: boolean | null
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
      memora_contacts: {
        Row: {
          birth_date: string
          created_at: string | null
          first_name: string
          id: string
          last_name: string
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          birth_date: string
          created_at?: string | null
          first_name: string
          id?: string
          last_name: string
          user_id: string
          whatsapp_number: string
        }
        Update: {
          birth_date?: string
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          user_id?: string
          whatsapp_number?: string
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
          ref_code: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_number: string
          ref_code?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_number?: string
          ref_code?: string | null
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
      telegram_groups: {
        Row: {
          created_at: string | null
          group_name: string | null
          group_type: string | null
          group_username: string | null
          id: string
          last_scraped_at: string | null
          member_count: number | null
          session_id: string | null
          telegram_group_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_name?: string | null
          group_type?: string | null
          group_username?: string | null
          id?: string
          last_scraped_at?: string | null
          member_count?: number | null
          session_id?: string | null
          telegram_group_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_name?: string | null
          group_type?: string | null
          group_username?: string | null
          id?: string
          last_scraped_at?: string | null
          member_count?: number | null
          session_id?: string | null
          telegram_group_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_groups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "telegram_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_members: {
        Row: {
          first_name: string | null
          group_id: string | null
          id: string
          is_bot: boolean | null
          is_premium: boolean | null
          last_name: string | null
          phone: string | null
          scraped_at: string | null
          telegram_user_id: number
          user_id: string
          username: string | null
        }
        Insert: {
          first_name?: string | null
          group_id?: string | null
          id?: string
          is_bot?: boolean | null
          is_premium?: boolean | null
          last_name?: string | null
          phone?: string | null
          scraped_at?: string | null
          telegram_user_id: number
          user_id: string
          username?: string | null
        }
        Update: {
          first_name?: string | null
          group_id?: string | null
          id?: string
          is_bot?: boolean | null
          is_premium?: boolean | null
          last_name?: string | null
          phone?: string | null
          scraped_at?: string | null
          telegram_user_id?: number
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "telegram_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          phone_number: string | null
          session_name: string
          session_string: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          session_name: string
          session_string: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          session_name?: string
          session_string?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unvrs_agent_sessions: {
        Row: {
          agent_instance_id: string | null
          agent_type: string
          context: Json | null
          conversation_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          last_activity_at: string | null
          started_at: string | null
          state: Json | null
          user_id: string
        }
        Insert: {
          agent_instance_id?: string | null
          agent_type: string
          context?: Json | null
          conversation_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_activity_at?: string | null
          started_at?: string | null
          state?: Json | null
          user_id: string
        }
        Update: {
          agent_instance_id?: string | null
          agent_type?: string
          context?: Json | null
          conversation_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_activity_at?: string | null
          started_at?: string | null
          state?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unvrs_agent_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unvrs_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      unvrs_conversations: {
        Row: {
          channel: string
          client_id: string | null
          contact_identifier: string
          contact_name: string | null
          created_at: string
          current_agent: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          metadata: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          client_id?: string | null
          contact_identifier: string
          contact_name?: string | null
          created_at?: string
          current_agent?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          client_id?: string | null
          contact_identifier?: string
          contact_name?: string | null
          created_at?: string
          current_agent?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_unvrs_conversations_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "unvrs_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unvrs_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      unvrs_leads: {
        Row: {
          company: string | null
          converted_at: string | null
          created_at: string
          email: string | null
          first_contact_at: string | null
          id: string
          metadata: Json | null
          name: string | null
          notes: string | null
          phone: string | null
          qualified_at: string | null
          source_channel: string | null
          source_conversation_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          first_contact_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          qualified_at?: string | null
          source_channel?: string | null
          source_conversation_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          first_contact_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          qualified_at?: string | null
          source_channel?: string | null
          source_conversation_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unvrs_leads_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "unvrs_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      unvrs_messages: {
        Row: {
          content: string | null
          content_type: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          media_url: string | null
          metadata: Json | null
          processed_by_agent: string | null
          transcription: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          content_type?: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          media_url?: string | null
          metadata?: Json | null
          processed_by_agent?: string | null
          transcription?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          content_type?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          media_url?: string | null
          metadata?: Json | null
          processed_by_agent?: string | null
          transcription?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unvrs_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unvrs_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      unvrs_project_briefs: {
        Row: {
          budget_range: string | null
          client_id: string | null
          collected_steps: Json | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          project_type: string | null
          requirements: Json | null
          status: string
          timeline_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          client_id?: string | null
          collected_steps?: Json | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          project_type?: string | null
          requirements?: Json | null
          status?: string
          timeline_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_range?: string | null
          client_id?: string | null
          collected_steps?: Json | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          project_type?: string | null
          requirements?: Json | null
          status?: string
          timeline_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unvrs_project_briefs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unvrs_project_briefs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unvrs_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unvrs_project_briefs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "unvrs_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      unvrs_project_quotes: {
        Row: {
          accepted_at: string | null
          assumptions: Json | null
          brief_id: string | null
          client_id: string | null
          created_at: string
          currency: string | null
          id: string
          lead_id: string | null
          line_items: Json | null
          quote_number: string | null
          risks: Json | null
          sent_at: string | null
          status: string
          subtotal: number | null
          tax: number | null
          timeline_days: number | null
          total: number | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          assumptions?: Json | null
          brief_id?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          lead_id?: string | null
          line_items?: Json | null
          quote_number?: string | null
          risks?: Json | null
          sent_at?: string | null
          status?: string
          subtotal?: number | null
          tax?: number | null
          timeline_days?: number | null
          total?: number | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          assumptions?: Json | null
          brief_id?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          lead_id?: string | null
          line_items?: Json | null
          quote_number?: string | null
          risks?: Json | null
          sent_at?: string | null
          status?: string
          subtotal?: number | null
          tax?: number | null
          timeline_days?: number | null
          total?: number | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unvrs_project_quotes_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "unvrs_project_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unvrs_project_quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unvrs_project_quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "unvrs_leads"
            referencedColumns: ["id"]
          },
        ]
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
      generate_ref_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_user_by_ref_code: {
        Args: { ref_code_param: string }
        Returns: string
      }
      lookup_user_by_username: {
        Args: { username_param: string }
        Returns: string
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
