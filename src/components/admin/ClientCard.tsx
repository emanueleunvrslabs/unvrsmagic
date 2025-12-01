import "../labs/SocialMediaCard.css";
import { Briefcase, FileText, Users, Pencil, Mail, MessageCircle, Receipt, Trash2, X } from "lucide-react";
import { useState } from "react";
import { SendEmailModal } from "./SendEmailModal";
import { WhatsAppChatModal } from "./WhatsAppChatModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface Client {
  id: string;
  company_name: string;
  vat_number: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  client_contacts: any[];
}

interface ClientCardProps {
  client: Client | null;
  onEdit: (client: Client) => void;
  onContactAdded?: () => void;
  clientProjects?: Array<{
    id: string;
    project_name: string;
    description?: string;
  }>;
  onCancel?: () => void;
  onClientCreated?: () => void;
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email address").max(255),
  whatsappNumber: z.string().trim().min(1, "WhatsApp number is required").max(20),
});

const projectSchema = z.object({
  projectName: z.string().trim().min(1, "Project name is required").max(200),
});

export function ClientCard({ client, onEdit, onContactAdded, clientProjects = [], onCancel, onClientCreated }: ClientCardProps) {
  const { toast } = useToast();
  const isCreationMode = client === null;
  const [isOpen, setIsOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(isCreationMode);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{ 
    email: string; 
    name: string;
    phone: string;
    id: string;
  } | null>(null);
  const [newClientData, setNewClientData] = useState({
    company_name: "",
    vat_number: "",
    street: "",
    city: "",
    postal_code: "",
  });
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    whatsappNumber: ""
  });
  const [editContact, setEditContact] = useState({
    name: "",
    email: "",
    whatsappNumber: ""
  });
  const [newProject, setNewProject] = useState({
    projectName: ""
  });
  const [editProject, setEditProject] = useState({
    projectName: ""
  });

  const handleAutoSaveContact = async () => {
    if (!newContact.name.trim() || !newContact.email.trim() || !newContact.whatsappNumber.trim()) {
      return; // Don't save if required fields are empty
    }

    try {
      const validated = contactSchema.parse(newContact);
      const nameParts = validated.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const clientId = isCreationMode ? createdClientId : client?.id;
      if (!clientId) return;

      const { error } = await supabase
        .from("client_contacts")
        .insert({
          client_id: clientId,
          first_name: firstName,
          last_name: lastName,
          email: validated.email,
          whatsapp_number: validated.whatsappNumber,
        });

      if (error) throw error;

      setNewContact({ name: "", email: "", whatsappNumber: "" });
      setShowAddContact(false);
      
      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add contact",
          variant: "destructive",
        });
      }
    }
  };

  const handleAutoUpdateContact = async (contactId: string) => {
    if (!editContact.name.trim() || !editContact.email.trim() || !editContact.whatsappNumber.trim()) {
      return;
    }

    try {
      const validated = contactSchema.parse(editContact);
      const nameParts = validated.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error } = await supabase
        .from("client_contacts")
        .update({
          first_name: firstName,
          last_name: lastName,
          email: validated.email,
          whatsapp_number: validated.whatsappNumber,
        })
        .eq("id", contactId);

      if (error) throw error;

      setEditingContactId(null);
      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update contact",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("client_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });

      setEditingContactId(null);
      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contact",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleAutoSaveProject = async () => {
    if (!newProject.projectName.trim()) {
      return;
    }

    try {
      const validated = projectSchema.parse(newProject);

      const clientId = isCreationMode ? createdClientId : client?.id;
      if (!clientId) return;

      const { error } = await supabase
        .from("client_projects")
        .insert({
          client_id: clientId,
          project_name: validated.projectName,
        });

      if (error) throw error;

      setNewProject({ projectName: "" });
      setShowAddProject(false);
      
      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add project",
          variant: "destructive",
        });
      }
    }
  };

  const handleAutoUpdateProject = async (projectId: string) => {
    if (!editProject.projectName.trim()) {
      return;
    }

    try {
      const validated = projectSchema.parse(editProject);

      const { error } = await supabase
        .from("client_projects")
        .update({
          project_name: validated.projectName,
        })
        .eq("id", projectId);

      if (error) throw error;

      setEditingProjectId(null);
      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update project",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("client_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      setEditingProjectId(null);
      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const startEditProject = (project: any) => {
    setEditingProjectId(project.id);
    setEditProject({
      projectName: project.project_name,
    });
  };

  const startEditContact = (contact: any) => {
    setEditingContactId(contact.id);
    setEditContact({
      name: contact.name,
      email: contact.email,
      whatsappNumber: contact.phone,
    });
  };

  const handleCreateOrUpdateClient = async (field?: string) => {
    // Prevent duplicate saves
    if (isSaving) return;
    
    try {
      if (!newClientData.company_name.trim() && !createdClientId) {
        return; // Don't create client without company name
      }

      setIsSaving(true);

      if (!createdClientId) {
        // Create new client only once
        const { data: createdClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            company_name: newClientData.company_name,
            vat_number: newClientData.vat_number || "",
            street: newClientData.street || "",
            city: newClientData.city || "",
            postal_code: newClientData.postal_code || "",
            country: "",
          })
          .select()
          .single();

        if (clientError) throw clientError;

        setCreatedClientId(createdClient.id);
        
        if (onContactAdded) {
          onContactAdded();
        }
        
        // Close the form after successful creation
        if (onClientCreated) {
          setTimeout(() => {
            onClientCreated();
          }, 300);
        }
      } else {
        // Update existing client
        const { error: updateError } = await supabase
          .from("clients")
          .update({
            company_name: newClientData.company_name,
            vat_number: newClientData.vat_number || "",
            street: newClientData.street || "",
            city: newClientData.city || "",
            postal_code: newClientData.postal_code || "",
          })
          .eq("id", createdClientId);

        if (updateError) throw updateError;

        if (onContactAdded) {
          onContactAdded();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save client",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExistingClient = async (field: string, value: string) => {
    if (!client?.id) return;

    try {
      const { error } = await supabase
        .from("clients")
        .update({ [field]: value })
        .eq("id", client.id);

      if (error) throw error;

      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update client",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async () => {
    if (!client?.id) return;
    
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });

      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete client",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const contacts = client?.client_contacts?.map(contact => ({
    id: contact.id,
    name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email,
    phone: contact.whatsapp_number
  })) || [];

  return (
    <>
      <div className="client-card-wrapper">
        <div 
          className={`social-media-card ${billingOpen || isOpen || projectsOpen ? 'expanded-lateral' : ''} group`}
        >
          {!isCreationMode && !billingOpen && !isOpen && !projectsOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Delete client"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
          
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[24px]">
              <div className="bg-background/95 border border-red-500/30 rounded-[18px] p-6 max-w-sm mx-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Delete Client</h3>
                  <p className="text-sm text-white/70">
                    Are you sure you want to delete {client?.company_name}? This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(false);
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-4 py-2 text-sm transition-colors rounded-[12px]"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClient();
                    }}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 text-sm transition-colors rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="card-main-content">
            <img
              src="https://uiverse.io/astronaut.png"
              alt="Astronaut"
              className="astronaut-image"
            />
            <div className="card-heading">
              {isCreationMode ? (
                <input
                  type="text"
                  value={newClientData.company_name}
                  onChange={(e) => setNewClientData({ ...newClientData, company_name: e.target.value })}
                  onBlur={() => handleCreateOrUpdateClient('company_name')}
                  placeholder="Enter company name"
                  className="bg-transparent border-b border-primary/30 text-white text-center text-xl font-bold px-2 py-1 focus:outline-none focus:border-primary/70 w-full max-w-xs"
                />
              ) : (
                client?.company_name
              )}
            </div>
            
            <div className="social-icons">
              <button 
                className="instagram-link" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (projectsOpen) {
                    setProjectsOpen(false);
                  } else {
                    setProjectsOpen(true);
                    setIsOpen(false);
                    setBillingOpen(false);
                  }
                }}
              >
                <Briefcase className="icon" strokeWidth={2} />
              </button>
              <button 
                className="x-link" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (billingOpen) {
                    setBillingOpen(false);
                  } else {
                    setBillingOpen(true);
                    setIsOpen(false);
                    setProjectsOpen(false);
                  }
                }}
              >
                <FileText className="icon" strokeWidth={2} />
              </button>
              <button 
                className="discord-link" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOpen) {
                    setIsOpen(false);
                  } else {
                    setIsOpen(true);
                    setBillingOpen(false);
                    setProjectsOpen(false);
                  }
                }}
              >
                <Users className="icon" strokeWidth={2} />
              </button>
            </div>

            {/* Collapsible Contacts Section */}
          </div>

          {/* Unified Lateral Panel */}
          <div className={`contacts-section-lateral ${isOpen || projectsOpen || billingOpen ? 'open' : ''}`}>
            {/* Contacts content */}
            {isOpen && (
              <>
                <div className="flex justify-end mb-3">
                  <button
                    className="text-xs text-purple-400/70 hover:text-purple-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddContact(!showAddContact);
                    }}
                  >
                    {showAddContact ? "Cancel" : "Add Contact"}
                  </button>
                </div>
                {showAddContact ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Name</label>
                      <input 
                        type="text"
                        value={newContact.name}
                        onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Email</label>
                      <input 
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">WhatsApp Number</label>
                      <input 
                        type="tel"
                        value={newContact.whatsappNumber}
                        onChange={(e) => setNewContact({...newContact, whatsappNumber: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="+1234567890"
                      />
                    </div>
                    <button
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderRadius: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoSaveContact();
                      }}
                      disabled={isSaving || !newContact.name || !newContact.email || !newContact.whatsappNumber}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : editingContactId ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Name</label>
                      <input 
                        type="text"
                        value={editContact.name}
                        onChange={(e) => setEditContact({...editContact, name: e.target.value})}
                        onBlur={() => handleAutoUpdateContact(editingContactId!)}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Email</label>
                      <input 
                        type="email"
                        value={editContact.email}
                        onChange={(e) => setEditContact({...editContact, email: e.target.value})}
                        onBlur={() => handleAutoUpdateContact(editingContactId!)}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">WhatsApp Number</label>
                      <input 
                        type="tel"
                        value={editContact.whatsappNumber}
                        onChange={(e) => setEditContact({...editContact, whatsappNumber: e.target.value})}
                        onBlur={() => handleAutoUpdateContact(editingContactId!)}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContact(editingContactId);
                        }}
                        disabled={deleting}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-3 py-2 text-xs transition-colors"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingContactId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  contacts.length > 0 && (
                    <>
                      {contacts.map((contact, index) => (
                        <div 
                          key={contact.id} 
                          className="social-icons contact-item-stagger"
                          style={{ animationDelay: `${index * 0.08}s` }}
                        >
                          <span className="contact-name-card text-left flex-1">{contact.name}</span>
                          <button
                            className="instagram-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContact(contact);
                              setEmailModalOpen(true);
                            }}
                            aria-label="Send email"
                          >
                            <Mail className="icon" strokeWidth={2} />
                          </button>
                          <button
                            className="x-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContact(contact);
                              setWhatsappModalOpen(true);
                            }}
                            aria-label="Send WhatsApp"
                          >
                            <MessageCircle className="icon" strokeWidth={2} />
                          </button>
                          <button
                            className="discord-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditContact(contact);
                            }}
                            aria-label="Edit contact"
                          >
                            <Pencil className="icon" strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                    </>
                  )
                )}
              </>
            )}

            {/* Projects content */}
            {projectsOpen && (
              <>
                <div className="flex justify-end mb-3">
                  <button
                    className="text-xs text-purple-400/70 hover:text-purple-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddProject(!showAddProject);
                    }}
                  >
                    {showAddProject ? "Cancel" : "Add Project"}
                  </button>
                </div>
                {showAddProject ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Project Name</label>
                      <input 
                        type="text"
                        value={newProject.projectName}
                        onChange={(e) => setNewProject({projectName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Enter project name"
                      />
                    </div>
                    <button
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderRadius: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoSaveProject();
                      }}
                      disabled={isSaving || !newProject.projectName}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : editingProjectId ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Project Name</label>
                      <input 
                        type="text"
                        value={editProject.projectName}
                        onChange={(e) => setEditProject({projectName: e.target.value})}
                        onBlur={() => handleAutoUpdateProject(editingProjectId!)}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(editingProjectId);
                        }}
                        disabled={deleting}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-3 py-2 text-xs transition-colors"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProjectId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  clientProjects.length > 0 ? (
                    <>
                      {clientProjects.map((project) => (
                        <div key={project.id} className="social-icons">
                          <span className="contact-name-card text-left flex-1">{project.project_name}</span>
                          <button
                            className="discord-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditProject(project);
                            }}
                            aria-label="Edit project"
                          >
                            <Pencil className="icon" strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col gap-3 w-full items-center justify-center py-8">
                      <span className="text-white/70 text-sm">No projects assigned</span>
                    </div>
                  )
                )}
              </>
            )}

            {/* Billing content */}
            {billingOpen && (
              <div className="flex flex-col gap-3 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Company Name</label>
                  <input 
                    type="text" 
                    value={isCreationMode ? newClientData.company_name : undefined}
                    defaultValue={!isCreationMode ? client?.company_name : undefined}
                    onChange={isCreationMode ? (e) => setNewClientData({ ...newClientData, company_name: e.target.value }) : undefined}
                    onBlur={isCreationMode ? () => handleCreateOrUpdateClient('company_name') : (e) => handleUpdateExistingClient('company_name', e.currentTarget.value)}
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">VAT Number</label>
                  <input 
                    type="text" 
                    value={isCreationMode ? newClientData.vat_number : undefined}
                    defaultValue={!isCreationMode ? client?.vat_number : undefined}
                    onChange={isCreationMode ? (e) => setNewClientData({ ...newClientData, vat_number: e.target.value }) : undefined}
                    onBlur={isCreationMode ? () => handleCreateOrUpdateClient('vat_number') : (e) => handleUpdateExistingClient('vat_number', e.currentTarget.value)}
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter VAT number"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Street</label>
                  <input 
                    type="text" 
                    value={isCreationMode ? newClientData.street : undefined}
                    defaultValue={!isCreationMode ? client?.street : undefined}
                    onChange={isCreationMode ? (e) => setNewClientData({ ...newClientData, street: e.target.value }) : undefined}
                    onBlur={isCreationMode ? () => handleCreateOrUpdateClient('street') : (e) => handleUpdateExistingClient('street', e.currentTarget.value)}
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">City</label>
                    <input 
                      type="text" 
                      value={isCreationMode ? newClientData.city : undefined}
                      defaultValue={!isCreationMode ? client?.city : undefined}
                      onChange={isCreationMode ? (e) => setNewClientData({ ...newClientData, city: e.target.value }) : undefined}
                      onBlur={isCreationMode ? () => handleCreateOrUpdateClient('city') : (e) => handleUpdateExistingClient('city', e.currentTarget.value)}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      style={{ borderRadius: '12px' }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Postal Code</label>
                    <input 
                      type="text" 
                      value={isCreationMode ? newClientData.postal_code : undefined}
                      defaultValue={!isCreationMode ? client?.postal_code : undefined}
                      onChange={isCreationMode ? (e) => setNewClientData({ ...newClientData, postal_code: e.target.value }) : undefined}
                      onBlur={isCreationMode ? () => handleCreateOrUpdateClient('postal_code') : (e) => handleUpdateExistingClient('postal_code', e.currentTarget.value)}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      style={{ borderRadius: '12px' }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedContact && client && (
        <>
          <SendEmailModal
            recipientEmail={selectedContact.email}
            recipientName={selectedContact.name}
            open={emailModalOpen}
            onOpenChange={setEmailModalOpen}
          />
          <WhatsAppChatModal
            open={whatsappModalOpen}
            onOpenChange={setWhatsappModalOpen}
            contactName={selectedContact.name}
            contactPhone={selectedContact.phone}
            clientId={client.id}
            contactId={selectedContact.id}
          />
        </>
      )}
    </>
  );
}
