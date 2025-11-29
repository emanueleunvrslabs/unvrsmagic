import "../labs/SocialMediaCard.css";
import { Briefcase, FileText, Users, Pencil, Mail, MessageCircle, Receipt } from "lucide-react";
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
  client: Client;
  onEdit: (client: Client) => void;
  onContactAdded?: () => void;
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email address").max(255),
  whatsappNumber: z.string().trim().min(1, "WhatsApp number is required").max(20),
});

export function ClientCard({ client, onEdit, onContactAdded }: ClientCardProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{ 
    email: string; 
    name: string;
    phone: string;
    id: string;
  } | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    whatsappNumber: ""
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

  const contacts = client.client_contacts?.map(contact => ({
    id: contact.id,
    name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email,
    phone: contact.whatsapp_number
  })) || [];

  return (
    <>
      <div className="client-card-wrapper">
        <div 
          className={`social-media-card ${billingOpen || isOpen ? 'expanded-lateral' : ''}`}
        >
          <div className="card-main-content">
            {isOpen && (
              <div className="absolute top-2 right-4 z-10">
                <button
                  className="text-xs text-primary/70 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddContact(!showAddContact);
                  }}
                >
                  {showAddContact ? "Cancel" : "Add Contact"}
                </button>
              </div>
            )}
            <img
              src="https://uiverse.io/astronaut.png"
              alt="Astronaut"
              className="astronaut-image"
            />
            <div className="card-heading">{client.company_name}</div>
            <div className="social-icons">
              <button className="instagram-link" onClick={(e) => e.stopPropagation()}>
                <Briefcase className="icon" strokeWidth={2} />
              </button>
              <button 
                className="x-link" 
                onClick={(e) => {
                  e.stopPropagation();
                  setBillingOpen(!billingOpen);
                  setIsOpen(false);
                }}
              >
                <FileText className="icon" strokeWidth={2} />
              </button>
              <button 
                className="discord-link" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                  setBillingOpen(false);
                }}
              >
                <Users className="icon" strokeWidth={2} />
              </button>
              <button 
                className="fourth-link" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(client);
                }}
              >
                <Pencil className="icon" strokeWidth={2} />
              </button>
            </div>

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
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '16px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input 
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '16px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">WhatsApp Number</label>
                  <input 
                    type="tel"
                    value={newContact.whatsappNumber}
                    onChange={(e) => setNewContact({...newContact, whatsappNumber: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '16px' }}
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
            ) : (
              contacts.length > 0 && (
                <>
                  {contacts.map((contact) => (
                    <div key={contact.id} className="contact-item-card">
                      <span className="contact-name-card">{contact.name}</span>
                      <div className="contact-actions-card">
                        <button
                          className="contact-btn-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContact(contact);
                            setEmailModalOpen(true);
                          }}
                          aria-label="Send email"
                        >
                          <Mail className="contact-icon-card" size={18} />
                        </button>
                        <button
                          className="contact-btn-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContact(contact);
                            setWhatsappModalOpen(true);
                          }}
                          aria-label="Send WhatsApp"
                        >
                          <MessageCircle className="contact-icon-card" size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )
            )}
          </div>

          {/* Collapsible Billing Section - Lateral */}
          <div className={`billing-section-lateral ${billingOpen ? 'open' : ''}`}>
            <div className="flex flex-col gap-3 w-full">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Company Name</label>
                <input 
                  type="text" 
                  defaultValue={client.company_name}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderRadius: '16px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">VAT Number</label>
                <input 
                  type="text" 
                  defaultValue={client.vat_number}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderRadius: '16px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Street</label>
                <input 
                  type="text" 
                  defaultValue={client.street}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderRadius: '16px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">City</label>
                  <input 
                    type="text" 
                    defaultValue={client.city}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '16px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Postal Code</label>
                  <input 
                    type="text" 
                    defaultValue={client.postal_code}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ borderRadius: '16px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedContact && (
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
