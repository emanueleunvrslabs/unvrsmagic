import "../labs/SocialMediaCard.css";
import { Briefcase, FileText, Users, Pencil, Mail, MessageCircle, Receipt, Trash2 } from "lucide-react";
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
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email address").max(255),
  whatsappNumber: z.string().trim().min(1, "WhatsApp number is required").max(20),
});

const projectSchema = z.object({
  projectName: z.string().trim().min(1, "Project name is required").max(200),
});

export function ClientCard({ client, onEdit, onContactAdded, clientProjects = [], onCancel }: ClientCardProps) {
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
    country: "",
  });
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

  const handleSaveContact = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);

    try {
      // Validate input
      const validated = contactSchema.parse(newContact);

      // Split name into first and last name
      const nameParts = validated.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Insert contact
      const { error } = await supabase
        .from("client_contacts")
        .insert({
          client_id: client.id,
          first_name: firstName,
          last_name: lastName,
          email: validated.email,
          whatsapp_number: validated.whatsappNumber,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact added successfully",
      });

      // Reset form
      setNewContact({ name: "", email: "", whatsappNumber: "" });
      setShowAddContact(false);
      
      // Trigger refresh
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
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContact = async (contactId: string) => {
    setSaving(true);

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

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

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
    } finally {
      setSaving(false);
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

  const handleSaveProject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);

    try {
      // Validate input
      const validated = projectSchema.parse(newProject);

      // Insert project
      const { error } = await supabase
        .from("client_projects")
        .insert({
          client_id: client.id,
          project_name: validated.projectName,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project added successfully",
      });

      // Reset form
      setNewProject({ projectName: "" });
      setShowAddProject(false);
      
      // Trigger refresh
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
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProject = async (projectId: string) => {
    setSaving(true);

    try {
      const validated = projectSchema.parse(editProject);

      const { error } = await supabase
        .from("client_projects")
        .update({
          project_name: validated.projectName,
        })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

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
    } finally {
      setSaving(false);
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

  const handleCreateClient = async () => {
    setSaving(true);

    try {
      if (!newClientData.company_name.trim()) {
        throw new Error("Company name is required");
      }

      const { data: createdClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          company_name: newClientData.company_name,
          vat_number: newClientData.vat_number || "",
          street: newClientData.street || "",
          city: newClientData.city || "",
          postal_code: newClientData.postal_code || "",
          country: newClientData.country || "",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      toast({
        title: "Success",
        description: "Client created successfully",
      });

      if (onContactAdded) {
        onContactAdded();
      }
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
          className={`social-media-card ${billingOpen || isOpen || projectsOpen ? 'expanded-lateral' : ''}`}
        >
          <div className="card-main-content">
            {isOpen && (
              <div className="absolute top-2 right-4 z-10">
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
            )}
            {projectsOpen && (
              <div className="absolute top-2 right-4 z-10">
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
            )}
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
                  placeholder="Enter company name"
                  className="bg-transparent border-b border-primary/30 text-white text-center text-xl font-bold px-2 py-1 focus:outline-none focus:border-primary/70 w-full max-w-xs"
                />
              ) : (
                client?.company_name
              )}
            </div>
              {isCreationMode && (
                <div className="flex gap-2 mt-2 justify-center w-full">
                  <button
                    className="bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-4 py-2 text-sm transition-colors"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCancel) onCancel();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

            {/* Collapsible Contacts Section */}
          </div>

          {/* Collapsible Contacts Section - Lateral */}
          <div className={`contacts-section-lateral ${isOpen ? 'open' : ''}`}>
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
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: '12px' }}
                  onClick={handleSaveContact}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Contact"}
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
                  <button
                    className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateContact(editingContactId);
                    }}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Update"}
                  </button>
                </div>
              </div>
            ) : (
              contacts.length > 0 && (
                <>
                  {contacts.map((contact) => (
                    <div key={contact.id} className="social-icons">
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
          </div>

          {/* Collapsible Projects Section - Lateral */}
          <div className={`contacts-section-lateral ${projectsOpen ? 'open' : ''}`}>
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
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: '12px' }}
                  onClick={handleSaveProject}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Project"}
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
                  <button
                    className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateProject(editingProjectId);
                    }}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Update"}
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
          </div>

          {/* Collapsible Billing Section - Lateral */}
          <div className={`billing-section-lateral ${billingOpen ? 'open' : ''}`}>
            <div className="flex flex-col gap-3 max-w-md">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Company Name</label>
                <input 
                  type="text" 
                  value={isCreationMode ? newClientData.company_name : undefined}
                  defaultValue={!isCreationMode ? client?.company_name : undefined}
                  onChange={isCreationMode ? (e) => setNewClientData({ ...newClientData, company_name: e.target.value }) : undefined}
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
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Country</label>
                <input 
                  type="text" 
                  value={isCreationMode ? newClientData.country : undefined}
                  defaultValue={!isCreationMode ? client?.country : undefined}
                  onChange={isCreationMode ? (e) => setNewClientData({ ...newClientData, country: e.target.value }) : undefined}
                  className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderRadius: '12px' }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Enter country"
                />
              </div>
              {isCreationMode && (
                <div className="flex gap-2 mt-2">
                  <button
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-4 py-2 text-sm transition-colors"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCancel) onCancel();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateClient();
                    }}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Client"}
                  </button>
                </div>
              )}
            </div>
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
