import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle, Pencil, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useState } from "react";
import { SendEmailModal } from "./SendEmailModal";
import { WhatsAppChatModal } from "./WhatsAppChatModal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

export function ClientCard({ client, onEdit, isOpen, onToggle }: ClientCardProps) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{ 
    email: string; 
    name: string;
    phone: string;
    id: string;
  } | null>(null);

  const handleEmail = (contact: { first_name: string; last_name: string; email: string; whatsapp_number: string; id: string }) => {
    setSelectedContact({
      email: contact.email,
      name: `${contact.first_name} ${contact.last_name}`,
      phone: contact.whatsapp_number,
      id: contact.id,
    });
    setEmailModalOpen(true);
  };

  const handleWhatsApp = (contact: { first_name: string; last_name: string; email: string; whatsapp_number: string; id: string }) => {
    setSelectedContact({
      email: contact.email,
      name: `${contact.first_name} ${contact.last_name}`,
      phone: contact.whatsapp_number,
      id: contact.id,
    });
    setWhatsappModalOpen(true);
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-1 flex-1">
            {client.company_name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 ml-2"
            onClick={() => onEdit(client)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
      </CardContent>

      <CardFooter className="flex flex-col items-start border-t p-4 mt-auto">
        {client.client_contacts && client.client_contacts.length > 0 ? (
          <Collapsible 
            open={isOpen} 
            onOpenChange={onToggle} 
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full flex items-center justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Contacts ({client.client_contacts.length})
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2">
                {client.client_contacts.map((contact: any) => (
                  <div key={contact.id} className="flex items-center justify-between w-full py-2">
                    <span className="text-sm font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEmail(contact)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleWhatsApp(contact)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <p className="text-sm text-muted-foreground">No contacts available</p>
        )}
      </CardFooter>

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
    </Card>
  );
}
