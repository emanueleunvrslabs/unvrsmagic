import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, X, FileText, Users } from "lucide-react";
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

interface NewClientCardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function NewClientCard({ onSuccess, onCancel }: NewClientCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingOpen, setBillingOpen] = useState(true);
  const [contactsOpen, setContactsOpen] = useState(false);
  
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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const validatedData = clientSchema.parse({
        ...formData,
        contacts,
      });

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

      onSuccess();
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
    <div className="w-full mb-8">
      {/* Company Name Card */}
      <div className="glassmorphism p-4 mb-1">
        <Input
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          placeholder="Enter company name"
          className="text-white bg-transparent border-none text-lg font-medium"
        />
      </div>

      {/* Action Icons Card */}
      <div className="glassmorphism p-4 mb-1">
        <div className="flex justify-center gap-8">
          <FileText
            className="h-6 w-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-110"
            style={{ color: 'hsl(var(--primary) / 0.8)' }}
            onClick={() => {
              setBillingOpen(!billingOpen);
              setContactsOpen(false);
            }}
          />
          <Users
            className="h-6 w-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-110"
            style={{ color: 'hsl(var(--primary) / 0.8)' }}
            onClick={() => {
              setContactsOpen(!contactsOpen);
              setBillingOpen(false);
            }}
          />
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="glassmorphism p-4">
        {/* Astronaut */}
        <div className="astronaut-container mb-4">
          <img src="/lovable-uploads/4c32c3aa-b52d-4b71-88e6-8f4ae825e63e.png" alt="Astronaut" className="astronaut" />
        </div>

        {/* Billing Section */}
        {billingOpen && (
          <div className="billing-section-lateral space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vat_number">VAT Number</Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                placeholder="Enter VAT number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="Enter postal code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Enter country"
              />
            </div>
          </div>
        )}

        {/* Contacts Section */}
        {contactsOpen && (
          <div className="contacts-section-lateral space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Contact Persons</h3>
              <Button type="button" onClick={addContact} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {contacts.map((contact, index) => (
              <div key={index} className="space-y-3 p-3 border border-border/50 rounded-lg relative">
                {contacts.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeContact(index)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`first_name_${index}`}>First Name</Label>
                    <Input
                      id={`first_name_${index}`}
                      value={contact.first_name}
                      onChange={(e) => updateContact(index, "first_name", e.target.value)}
                      placeholder="First name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`last_name_${index}`}>Last Name</Label>
                    <Input
                      id={`last_name_${index}`}
                      value={contact.last_name}
                      onChange={(e) => updateContact(index, "last_name", e.target.value)}
                      placeholder="Last name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`whatsapp_${index}`}>WhatsApp</Label>
                    <Input
                      id={`whatsapp_${index}`}
                      value={contact.whatsapp_number}
                      onChange={(e) => updateContact(index, "whatsapp_number", e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`email_${index}`}>Email</Label>
                    <Input
                      id={`email_${index}`}
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(index, "email", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Client"}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={loading}
            className="flex-1 gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
