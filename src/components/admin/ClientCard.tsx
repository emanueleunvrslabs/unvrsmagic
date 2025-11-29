import "../labs/SocialMediaCard.css";
import { Briefcase, FileText, StickyNote, Pencil, Mail, MessageCircle, Receipt } from "lucide-react";
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
  const [selectedContact, setSelectedContact] = useState<{ 
    email: string; 
    name: string;
    phone: string;
    id: string;
  } | null>(null);

  const contacts = client.client_contacts?.map(contact => ({
    id: contact.id,
    name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email,
    phone: contact.whatsapp_number
  })) || [];

  return (
    <>
      <div 
        className={`social-media-card ${(isOpen || billingOpen) ? 'expanded' : ''}`}
      >
        <img
          src="https://uiverse.io/astronaut.png"
          alt="Astronaut"
          className="astronaut-image"
        />
        <div className="card-heading">{client.company_name}</div>
        <div className="social-icons">
          <a href="#" className="instagram-link" onClick={(e) => e.stopPropagation()}>
            <Briefcase className="icon" strokeWidth={2} />
          </a>
          <a 
            href="#" 
            className="x-link" 
            onClick={(e) => {
              e.stopPropagation();
              setBillingOpen(!billingOpen);
              setIsOpen(false);
            }}
          >
            <Receipt className="icon" strokeWidth={2} />
          </a>
          <a 
            href="#" 
            className="discord-link" 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
              setBillingOpen(false);
            }}
          >
            <StickyNote className="icon" strokeWidth={2} />
          </a>
          <a 
            href="#" 
            className="fourth-link" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(client);
            }}
          >
            <Pencil className="icon" strokeWidth={2} />
          </a>
        </div>

        {/* Collapsible Billing Section */}
        <div className={`contacts-section ${billingOpen ? 'open' : ''}`}>
          <div className="flex flex-col gap-3 w-full">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Company Name</label>
              <input 
                type="text" 
                defaultValue={client.company_name}
                className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ borderRadius: '16px' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">VAT Number</label>
              <input 
                type="text" 
                defaultValue={client.vat_number}
                className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ borderRadius: '16px' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Street</label>
              <input 
                type="text" 
                defaultValue={client.street}
                className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderRadius: '16px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Postal Code</label>
                <input 
                  type="text" 
                  defaultValue={client.postal_code}
                  className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ borderRadius: '16px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Country</label>
              <input 
                type="text" 
                defaultValue={client.country}
                className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ borderRadius: '16px' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>

        {/* Collapsible Contacts Section */}
        <div className={`contacts-section ${isOpen ? 'open' : ''}`}>
          {contacts.length > 0 ? (
            contacts.map((contact) => (
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
            ))
          ) : (
            <div className="contact-item-card">
              <span className="contact-name-card text-muted-foreground">No contacts available</span>
            </div>
          )}
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
