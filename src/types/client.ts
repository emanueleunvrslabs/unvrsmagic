// Client Management TypeScript Interfaces

export interface ClientContact {
  id: string;
  client_id?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  whatsapp_number?: string;
  created_at?: string;
  // UI field mappings used in components
  name?: string;
  phone?: string;
}

export interface ClientProject {
  id: string;
  client_id: string;
  project_name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  company_name: string;
  vat_number: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  client_contacts?: ClientContact[];
}

export interface ClientEmail {
  id: string;
  client_id: string;
  contact_id?: string | null;
  user_id: string;
  subject: string;
  body: string;
  sender_email: string;
  recipient_email: string;
  direction: string;
  status?: string | null;
  attachments?: unknown;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export interface ClientTodo {
  id: string;
  client_id: string;
  user_id: string;
  text: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientKanbanTask {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  client_id: string;
  contact_id: string;
  user_id: string;
  message: string;
  direction: 'inbound' | 'outbound';
  status?: string;
  created_at: string;
}
