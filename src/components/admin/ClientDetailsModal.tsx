import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Building2, CreditCard, X } from "lucide-react";

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogTitle className="text-2xl font-bold mb-2">{client.company_name}</DialogTitle>
          <p className="text-muted-foreground">
            Complete billing and contact information for this client
          </p>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Billing Information */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Billing Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">VAT Number</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{client.vat_number}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{client.street}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.city}, {client.postal_code}
                        </p>
                        <p className="text-sm text-muted-foreground">{client.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Statistics */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold mb-4">Client Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contacts</p>
                    <p className="text-2xl font-bold">{client.client_contacts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-xl font-semibold">{client.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Persons */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold mb-4">Contact Persons</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {client.client_contacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-lg">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            Contact #{index + 1}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-primary hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`https://wa.me/${contact.whatsapp_number.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {contact.whatsapp_number}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Edit Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
