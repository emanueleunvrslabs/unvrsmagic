import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Contact {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp_number: string;
}

interface Client {
  id: string;
  company_name: string;
  vat_number: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  client_contacts: Contact[];
}

interface EditClientModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditClientModal({ client, open, onOpenChange, onSuccess }: EditClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    company_name: "",
    vat_number: "",
    street: "",
    city: "",
    postal_code: "",
    country: "",
    client_contacts: []
  });

  // Update form when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name,
        vat_number: client.vat_number,
        street: client.street,
        city: client.city,
        postal_code: client.postal_code,
        country: client.country,
        client_contacts: client.client_contacts || []
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setLoading(true);

    try {
      // Update client billing info
      const { error: clientError } = await supabase
        .from("clients")
        .update({
          company_name: formData.company_name,
          vat_number: formData.vat_number,
          street: formData.street,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
        })
        .eq("id", client.id);

      if (clientError) throw clientError;

      // Delete existing contacts
      const { error: deleteError } = await supabase
        .from("client_contacts")
        .delete()
        .eq("client_id", client.id);

      if (deleteError) throw deleteError;

      // Insert updated contacts
      if (formData.client_contacts.length > 0) {
        const { error: contactsError } = await supabase
          .from("client_contacts")
          .insert(
            formData.client_contacts.map(contact => ({
              client_id: client.id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              whatsapp_number: contact.whatsapp_number,
            }))
          );

        if (contactsError) throw contactsError;
      }

      toast.success("Client updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  const addContact = () => {
    setFormData({
      ...formData,
      client_contacts: [
        ...formData.client_contacts,
        { first_name: "", last_name: "", email: "", whatsapp_number: "" }
      ]
    });
  };

  const removeContact = (index: number) => {
    setFormData({
      ...formData,
      client_contacts: formData.client_contacts.filter((_, i) => i !== index)
    });
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updatedContacts = [...formData.client_contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData({ ...formData, client_contacts: updatedContacts });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Billing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Billing Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vat_number">VAT Number *</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number}
                  onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Street *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Persons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Contact Persons</h3>
              <Button type="button" onClick={addContact} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </div>

            {formData.client_contacts.map((contact, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contact {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContact(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={contact.first_name}
                      onChange={(e) => updateContact(index, "first_name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      value={contact.last_name}
                      onChange={(e) => updateContact(index, "last_name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(index, "email", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>WhatsApp Number *</Label>
                    <Input
                      value={contact.whatsapp_number}
                      onChange={(e) => updateContact(index, "whatsapp_number", e.target.value)}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.client_contacts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contacts added yet. Click "Add Contact" to add one.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
