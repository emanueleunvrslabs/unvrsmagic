import "../labs/SocialMediaCard.css";
import { Mail, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ContactsCardProps {
  clientId: string;
  contacts: Contact[];
  onContactAdded: () => void;
  onEmailClick: (contact: Contact) => void;
  onWhatsAppClick: (contact: Contact) => void;
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email address").max(255),
  whatsappNumber: z.string().trim().min(1, "WhatsApp number is required").max(20),
});

export function ContactsCard({ 
  clientId, 
  contacts, 
  onContactAdded, 
  onEmailClick,
  onWhatsAppClick 
}: ContactsCardProps) {
  const { toast } = useToast();
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const handleAutoSaveContact = async () => {
    if (!newContact.name.trim() || !newContact.email.trim() || !newContact.whatsappNumber.trim()) {
      return;
    }

    try {
      const validated = contactSchema.parse(newContact);
      const nameParts = validated.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

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
      onContactAdded();
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
      onContactAdded();
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
      onContactAdded();
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

  const startEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditContact({
      name: contact.name,
      email: contact.email,
      whatsappNumber: contact.phone,
    });
  };

  return (
    <div className="client-card-wrapper">
      <div className="social-media-card expanded-lateral">
        <div className="contacts-section-lateral open">
          <div className="flex justify-center mb-3">
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
            contacts.length > 0 ? (
              <>
                {contacts.map((contact, index) => (
                  <div 
                    key={contact.id} 
                    className="social-icons contact-item-stagger cursor-pointer"
                    style={{ animationDelay: `${index * 0.08}s` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditContact(contact);
                    }}
                  >
                    <span className="contact-name-card">{contact.name}</span>
                    <button
                      className="instagram-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEmailClick(contact);
                      }}
                      aria-label="Send email"
                    >
                      <Mail className="icon" strokeWidth={2} />
                    </button>
                    <button
                      className="x-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWhatsAppClick(contact);
                      }}
                      aria-label="Send WhatsApp"
                    >
                      <MessageCircle className="icon" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No contacts yet
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
