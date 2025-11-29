import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Client {
  id: string;
  company_name: string;
  vat_number: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  client_contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    whatsapp_number: string;
  }>;
}

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailsModal({ client, isOpen, onClose }: ClientDetailsModalProps) {
  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client.company_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Billing Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">VAT Number</p>
                <p className="font-medium">{client.vat_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{client.country}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {client.street}, {client.city} {client.postal_code}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Persons */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Contact Persons</h3>
            <div className="space-y-3">
              {client.client_contacts.map((contact) => (
                <div key={contact.id} className="p-4 border border-border rounded-lg">
                  <p className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>Email: {contact.email}</p>
                    <p>WhatsApp: {contact.whatsapp_number}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
