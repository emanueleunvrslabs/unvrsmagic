import { useState, useCallback, useEffect } from "react";
import { File, CheckSquare, Kanban, Mail, MessageCircle, Plus, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "./SocialMediaCard.css";

interface MockClient {
  id: string;
  company_name: string;
  city: string;
}

interface Contact {
  name: string;
  email: string;
  whatsapp: string;
}

const mockClients: MockClient[] = [
  { id: "1", company_name: "Acme Corporation", city: "Milano" },
  { id: "2", company_name: "Tech Solutions", city: "Roma" },
  { id: "3", company_name: "Global Industries", city: "Torino" },
  { id: "4", company_name: "Future Systems", city: "Napoli" },
  { id: "5", company_name: "Digital Ventures", city: "Firenze" },
  { id: "6", company_name: "Smart Services", city: "Bologna" },
  { id: "7", company_name: "Innovation Hub", city: "Venezia" },
  { id: "8", company_name: "Cloud Partners", city: "Genova" },
];

const actionItems = [
  { id: "documents", label: "Documents", icon: File },
  { id: "notes", label: "Notes", icon: CheckSquare },
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export function AppleTVClientsDemo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isNewClientView = searchParams.get("view") === "new";
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [newClient, setNewClient] = useState({
    companyName: "",
    vatNumber: "",
    street: "",
    city: "",
    postalCode: "",
    country: ""
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    whatsapp: ""
  });
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  const handleCreateClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from('clients').insert({
        user_id: user.id,
        company_name: newClient.companyName,
        vat_number: newClient.vatNumber,
        street: newClient.street,
        city: newClient.city,
        postal_code: newClient.postalCode,
        country: newClient.country
      });

      if (error) throw error;

      toast.success("Client created successfully");
      setNewClient({ companyName: "", vatNumber: "", street: "", city: "", postalCode: "", country: "" });
      setContacts([]);
      setNewContact({ name: "", email: "", whatsapp: "" });
      setShowAddContact(false);
      setSearchParams({});
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Error creating client");
    }
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // New Client Form View
  if (isNewClientView) {
    return (
      <div className="relative h-full flex flex-col items-center justify-start p-8 pt-4 overflow-y-auto">
        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Card - Bill Information */}
          <div className="relative rounded-[22px] overflow-hidden p-8 bg-white/[0.08] backdrop-blur-[36px] backdrop-saturate-[1.2] border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <h3 className="text-white/90 text-lg font-semibold mb-6">Bill Information</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Company Name</Label>
                <Input
                  placeholder="Enter company name"
                  value={newClient.companyName}
                  onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">VAT Number</Label>
                <Input
                  placeholder="Enter VAT number"
                  value={newClient.vatNumber}
                  onChange={(e) => setNewClient({ ...newClient, vatNumber: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Street</Label>
                <Input
                  placeholder="Enter street address"
                  value={newClient.street}
                  onChange={(e) => setNewClient({ ...newClient, street: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">City</Label>
                  <Input
                    placeholder="Enter city"
                    value={newClient.city}
                    onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Postal Code</Label>
                  <Input
                    placeholder="Enter postal code"
                    value={newClient.postalCode}
                    onChange={(e) => setNewClient({ ...newClient, postalCode: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Country</Label>
                <Input
                  placeholder="Enter country"
                  value={newClient.country}
                  onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-12"
                />
              </div>
            </div>
          </div>

          {/* Right Card - Contacts */}
          <div className="relative rounded-[22px] overflow-hidden p-8 bg-white/[0.08] backdrop-blur-[36px] backdrop-saturate-[1.2] border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white/90 text-lg font-semibold">Contacts</h3>
              {!showAddContact && (
                <button
                  onClick={() => setShowAddContact(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact
                </button>
              )}
            </div>

            {/* Contacts List */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {contacts.length === 0 && !showAddContact && (
                <div className="flex flex-col items-center justify-center py-8 text-white/40">
                  <User className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No contacts added yet</p>
                </div>
              )}
              
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <p className="text-white/90 font-medium">{contact.name}</p>
                    <p className="text-white/50 text-sm">{contact.email}</p>
                    <p className="text-white/50 text-sm">{contact.whatsapp}</p>
                  </div>
                  <button
                    onClick={() => setContacts(contacts.filter((_, i) => i !== index))}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add Contact Form */}
              {showAddContact && (
                <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Name</Label>
                    <Input
                      placeholder="Enter contact name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">WhatsApp</Label>
                    <Input
                      placeholder="Enter WhatsApp number"
                      value={newContact.whatsapp}
                      onChange={(e) => setNewContact({ ...newContact, whatsapp: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl h-10"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowAddContact(false);
                        setNewContact({ name: "", email: "", whatsapp: "" });
                      }}
                      className="flex-1 p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (newContact.name && newContact.email && newContact.whatsapp) {
                          setContacts([...contacts, { ...newContact }]);
                          setNewContact({ name: "", email: "", whatsapp: "" });
                          setShowAddContact(false);
                        } else {
                          toast.error("Please fill all contact fields");
                        }
                      }}
                      className="flex-1 p-2 rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Create Button */}
            <button 
              onClick={handleCreateClient}
              className="w-full p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 shadow-lg shadow-white/5 text-sm font-medium mt-6"
            >
              Create Client
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col pt-4 overflow-hidden">
      {/* Carousel Gallery */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-h-[55%]">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {mockClients.map((client, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={client.id}
                  className="flex-[0_0_50%] min-w-0 px-4"
                >
                  <div
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                      "labs-client-card relative aspect-[16/9] rounded-[20px] overflow-hidden cursor-pointer",
                      "transition-all duration-500 ease-out",
                      isSelected
                        ? "scale-100 opacity-100"
                        : "scale-90 opacity-40 hover:opacity-60"
                    )}
                  >
                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-between p-8 z-10">
                      <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                          {client.company_name}
                        </h2>
                        <p className="text-white/60 text-lg mt-2">{client.city}</p>
                      </div>
                      <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <span className="text-4xl font-bold text-white/80">
                          {client.company_name[0]}
                        </span>
                      </div>
                    </div>

                    {/* Selected Glow */}
                    {isSelected && (
                      <div className="absolute inset-0 ring-1 ring-white/20 rounded-[20px] shadow-[0_0_60px_rgba(155,64,252,0.3)]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {mockClients.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === selectedIndex
                  ? "bg-white w-6"
                  : "bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Action Cards */}
      <div className="relative z-10 px-8 py-10">
        <div className="grid grid-cols-5 gap-4">
          {actionItems.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className={cn(
                  "p-5 rounded-2xl transition-all duration-300",
                  "bg-white/5 backdrop-blur-xl border border-white/10",
                  "hover:border-white/30 hover:bg-white/10 hover:scale-105",
                  "flex flex-col items-center gap-3"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white/70" strokeWidth={1.5} />
                </div>
                <span className="text-white/70 text-sm font-medium">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
