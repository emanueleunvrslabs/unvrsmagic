import "../labs/SocialMediaCard.css";
import { Briefcase, FileText, StickyNote, Settings, Mail, MessageCircle } from "lucide-react";
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
        className={`social-media-card ${isOpen ? 'expanded' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
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
          <a href="#" className="x-link" onClick={(e) => e.stopPropagation()}>
            <FileText className="icon" strokeWidth={2} />
          </a>
          <a href="#" className="discord-link" onClick={(e) => e.stopPropagation()}>
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
            <Settings className="icon" strokeWidth={2} />
          </a>
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
