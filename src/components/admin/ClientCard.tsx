import { Card } from "@/components/ui/card";
import { Briefcase, FileText, StickyNote, Settings, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { SendEmailModal } from "./SendEmailModal";
import { WhatsAppChatModal } from "./WhatsAppChatModal";
import "@/styles/social-card.css";

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
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export function ClientCard({ client, onEdit }: ClientCardProps) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{ 
    email: string; 
    name: string;
    phone: string;
    id: string;
  } | null>(null);
  const [showContactsModal, setShowContactsModal] = useState(false);

  return (
    <>
      <div className="social-cards-wrapper">
        <div className="social-card company-name-card-simple">
          <div className="company-name-content-simple">
            <span className="company-name-text">{client.company_name}</span>
          </div>
        </div>

        <div className="social-card icons-card">
          <ul>
            <li className="social-iso-pro">
              <span></span>
              <span></span>
              <span></span>
              <a href="#" onClick={(e) => { e.preventDefault(); /* TODO: Navigate to projects */ }}>
                <div className="social-svg-wrapper">
                  <Briefcase className="social-svg-icon" strokeWidth={2} />
                </div>
              </a>
              <div className="social-text">Projects</div>
            </li>
            <li className="social-iso-pro">
              <span></span>
              <span></span>
              <span></span>
              <a href="#" onClick={(e) => { e.preventDefault(); /* TODO: Navigate to invoices */ }}>
                <div className="social-svg-wrapper">
                  <FileText className="social-svg-icon" strokeWidth={2} />
                </div>
              </a>
              <div className="social-text">Invoice</div>
            </li>
            <li className="social-iso-pro">
              <span></span>
              <span></span>
              <span></span>
              <a href="#" onClick={(e) => { e.preventDefault(); /* TODO: Navigate to notes */ }}>
                <div className="social-svg-wrapper">
                  <StickyNote className="social-svg-icon" strokeWidth={2} />
                </div>
              </a>
              <div className="social-text">Note</div>
            </li>
            <li className="social-iso-pro">
              <span></span>
              <span></span>
              <span></span>
              <a href="#" onClick={(e) => { e.preventDefault(); onEdit(client); }}>
                <div className="social-svg-wrapper">
                  <Settings className="social-svg-icon" strokeWidth={2} />
                </div>
              </a>
              <div className="social-text">Edit</div>
            </li>
          </ul>
        </div>

        {client.client_contacts && client.client_contacts.length > 0 && (
          <div className="social-card contacts-list-card">
            <div className="contacts-list">
              {client.client_contacts.map((contact: any) => (
                <div key={contact.id} className="contact-item">
                  <span className="contact-name">
                    {contact.first_name} {contact.last_name}
                  </span>
                  <div className="contact-actions">
                    <button
                      className="contact-action-btn"
                      onClick={() => {
                        setSelectedContact({
                          email: contact.email,
                          name: `${contact.first_name} ${contact.last_name}`,
                          phone: contact.whatsapp_number,
                          id: contact.id,
                        });
                        setEmailModalOpen(true);
                      }}
                      aria-label="Send email"
                    >
                      <Mail className="contact-action-icon" />
                    </button>
                    <button
                      className="contact-action-btn"
                      onClick={() => {
                        setSelectedContact({
                          email: contact.email,
                          name: `${contact.first_name} ${contact.last_name}`,
                          phone: contact.whatsapp_number,
                          id: contact.id,
                        });
                        setWhatsappModalOpen(true);
                      }}
                      aria-label="Send WhatsApp message"
                    >
                      <MessageCircle className="contact-action-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contacts Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowContactsModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Contacts for {client.company_name}</h3>
            {client.client_contacts && client.client_contacts.length > 0 ? (
              <div className="space-y-3">
                {client.client_contacts.map((contact: any) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                        onClick={() => {
                          setSelectedContact({
                            email: contact.email,
                            name: `${contact.first_name} ${contact.last_name}`,
                            phone: contact.whatsapp_number,
                            id: contact.id,
                          });
                          setEmailModalOpen(true);
                          setShowContactsModal(false);
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                        onClick={() => {
                          setSelectedContact({
                            email: contact.email,
                            name: `${contact.first_name} ${contact.last_name}`,
                            phone: contact.whatsapp_number,
                            id: contact.id,
                          });
                          setWhatsappModalOpen(true);
                          setShowContactsModal(false);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No contacts available</p>
            )}
          </Card>
        </div>
      )}

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
