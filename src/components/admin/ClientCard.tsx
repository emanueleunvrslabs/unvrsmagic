import "../labs/SocialMediaCard.css";
import { Briefcase, FileText, Users, Pencil, Mail, MessageCircle, Receipt } from "lucide-react";
import { useState } from "react";
import { SendEmailModal } from "./SendEmailModal";
import { WhatsAppChatModal } from "./WhatsAppChatModal";

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
}

export function ClientCard({ client, onEdit }: ClientCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
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
          className={`social-media-card ${billingOpen ? 'expanded-lateral' : (isOpen ? 'expanded' : '')}`}
        >
          <div className="card-main-content">
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
            <div className={`contacts-section ${isOpen ? 'open' : ''}`}>
              {contacts.length > 0 && (
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
              )}
              
              <button
                className="w-full text-center text-sm text-primary/70 hover:text-primary transition-colors py-2 mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddContact(!showAddContact);
                }}
              >
                {showAddContact ? "Cancel" : "Add Contact"}
              </button>
              
              {showAddContact && (
                <div className="flex flex-col gap-3 w-full mt-3 pt-3 border-t border-white/10">
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
                    className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-3 text-sm transition-colors"
                    style={{ borderRadius: '16px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Save contact functionality will be implemented
                      console.log("Save contact:", newContact);
                    }}
                  >
                    Save Contact
                  </button>
                </div>
              )}
            </div>
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
