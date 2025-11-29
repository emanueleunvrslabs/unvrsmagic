import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  whatsapp_number: z.string().trim().min(1, "WhatsApp number is required").max(20),
  email: z.string().trim().email("Invalid email address").max(255),
});

const clientSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(255),
  vat_number: z.string().trim().min(1, "VAT number is required").max(50),
  street: z.string().trim().min(1, "Street is required").max(255),
  city: z.string().trim().min(1, "City is required").max(100),
  postal_code: z.string().trim().min(1, "Postal code is required").max(20),
  country: z.string().trim().min(1, "Country is required").max(100),
  contacts: z.array(contactSchema).min(1, "At least one contact person is required"),
});

type Contact = z.infer<typeof contactSchema>;
type ClientFormData = z.infer<typeof clientSchema>;

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewClientModal({ open, onOpenChange, onSuccess }: NewClientModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Omit<ClientFormData, 'contacts'>>({
    company_name: "",
    vat_number: "",
    street: "",
    city: "",
    postal_code: "",
    country: "",
  });

  const [contacts, setContacts] = useState<Contact[]>([
    { first_name: "", last_name: "", whatsapp_number: "", email: "" }
  ]);

  const addContact = () => {
    setContacts([...contacts, { first_name: "", last_name: "", whatsapp_number: "", email: "" }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validatedData = clientSchema.parse({
        ...formData,
        contacts,
      });

      // Insert client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          company_name: validatedData.company_name,
          vat_number: validatedData.vat_number,
          street: validatedData.street,
          city: validatedData.city,
          postal_code: validatedData.postal_code,
          country: validatedData.country,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Insert contacts
      const contactsToInsert = validatedData.contacts.map(contact => ({
        client_id: client.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        whatsapp_number: contact.whatsapp_number,
        email: contact.email,
      }));

      const { error: contactsError } = await supabase
        .from("client_contacts")
        .insert(contactsToInsert);

      if (contactsError) throw contactsError;

      toast({
        title: "Success",
        description: "Client created successfully",
      });

      // Reset form
      setFormData({ 
        company_name: "", 
        vat_number: "", 
        street: "", 
        city: "", 
        postal_code: "", 
        country: "" 
      });
      setContacts([{ first_name: "", last_name: "", whatsapp_number: "", email: "" }]);
      
      onSuccess();
      onOpenChange(false);
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
          description: error instanceof Error ? error.message : "Failed to create client",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Billing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Billing Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat_number">VAT Number *</Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                placeholder="Enter VAT number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Enter street address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="Enter postal code"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Enter country"
                required
              />
            </div>
          </div>

          {/* Contact Persons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Contact Persons</h3>
              <Button type="button" onClick={addContact} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </div>

            {contacts.map((contact, index) => (
              <div key={index} className="space-y-3 p-4 border border-border rounded-lg relative">
                {contacts.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeContact(index)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`first_name_${index}`}>First Name *</Label>
                    <Input
                      id={`first_name_${index}`}
                      value={contact.first_name}
                      onChange={(e) => updateContact(index, "first_name", e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`last_name_${index}`}>Last Name *</Label>
                    <Input
                      id={`last_name_${index}`}
                      value={contact.last_name}
                      onChange={(e) => updateContact(index, "last_name", e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`whatsapp_${index}`}>WhatsApp Number *</Label>
                    <Input
                      id={`whatsapp_${index}`}
                      value={contact.whatsapp_number}
                      onChange={(e) => updateContact(index, "whatsapp_number", e.target.value)}
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`email_${index}`}>Email *</Label>
                    <Input
                      id={`email_${index}`}
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(index, "email", e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
