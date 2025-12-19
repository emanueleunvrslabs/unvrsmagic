import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Trash2, MessageCircle, Cake, Gift, Calendar, Check } from "lucide-react";
import { format, differenceInDays, setYear, isToday, isTomorrow, addYears } from "date-fns";
import { enUS } from "date-fns/locale";

interface MemoraContact {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  whatsapp_number: string;
  created_at: string;
}

const Memora = () => {
  const [contacts, setContacts] = useState<MemoraContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch user profile and contacts
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Get username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single();

      if (profile?.username) {
        setUsername(profile.username);
      }

      // Get contacts
      const { data: contactsData, error } = await supabase
        .from("memora_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("birth_date", { ascending: true });

      if (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Error loading contacts");
      } else {
        setContacts(contactsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("memora-contacts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "memora_contacts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setContacts((prev) => [...prev, payload.new as MemoraContact]);
            toast.success("New contact added!");
          } else if (payload.eventType === "DELETE") {
            setContacts((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const copyLink = () => {
    if (!username) return;
    // Use production domain in production, otherwise use current origin for dev/preview
    const baseUrl = window.location.hostname === 'unvrslabs.dev' 
      ? 'https://unvrslabs.dev' 
      : window.location.origin;
    const link = `${baseUrl}/${username}/memora`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from("memora_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting contact");
    } else {
      toast.success("Contact deleted");
    }
  };

  const sendWhatsApp = (number: string, name: string) => {
    const message = encodeURIComponent(`Tanti auguri ${name}! 🎂🎉`);
    window.open(`https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${message}`, "_blank");
  };

  // Calculate days until next birthday
  const getDaysUntilBirthday = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let nextBirthday = setYear(birth, today.getFullYear());
    
    if (nextBirthday < today) {
      nextBirthday = addYears(nextBirthday, 1);
    }
    
    return differenceInDays(nextBirthday, today);
  };

  const getBirthdayBadge = (birthDate: string) => {
    const days = getDaysUntilBirthday(birthDate);
    const birth = new Date(birthDate);
    const today = new Date();
    let nextBirthday = setYear(birth, today.getFullYear());
    if (nextBirthday < today) {
      nextBirthday = addYears(nextBirthday, 1);
    }

    if (isToday(nextBirthday)) {
      return <Badge className="bg-primary text-primary-foreground animate-pulse">🎂 Today!</Badge>;
    } else if (isTomorrow(nextBirthday)) {
      return <Badge className="bg-accent text-accent-foreground">Tomorrow</Badge>;
    } else if (days <= 7) {
      return <Badge variant="secondary">In {days} days</Badge>;
    } else if (days <= 30) {
      return <Badge variant="outline">In {days} days</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">{days} days</Badge>;
  };

  // Sort contacts by next birthday
  const sortedContacts = [...contacts].sort((a, b) => {
    return getDaysUntilBirthday(a.birth_date) - getDaysUntilBirthday(b.birth_date);
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Cake className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Memora</h1>
              <p className="text-muted-foreground">Remember the birthdays of your loved ones</p>
            </div>
          </div>
        </div>

        {/* Share Link Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Your shareable link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Share this link with friends and family. They can enter their birthday and you'll receive the data here.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-muted rounded-lg border border-border font-mono text-sm text-foreground truncate">
                {username ? `${window.location.origin}/${username}/memora` : "Loading..."}
              </div>
              <Button 
                onClick={copyLink} 
                disabled={!username}
                className={copied ? "bg-green-600 hover:bg-green-600" : ""}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Your contacts ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : sortedContacts.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Cake className="h-16 w-16 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">No contacts yet</p>
                <p className="text-muted-foreground/70 text-sm">
                  Share the link with your friends to start collecting their birthdays!
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Date of birth</TableHead>
                    <TableHead className="text-muted-foreground">Next birthday</TableHead>
                    <TableHead className="text-muted-foreground">WhatsApp</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContacts.map((contact) => (
                    <TableRow key={contact.id} className="border-border hover:bg-muted/50">
                      <TableCell className="text-foreground font-medium">
                        {contact.first_name} {contact.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(contact.birth_date), "MMMM d, yyyy", { locale: enUS })}
                      </TableCell>
                      <TableCell>
                        {getBirthdayBadge(contact.birth_date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {contact.whatsapp_number}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          onClick={() => sendWhatsApp(contact.whatsapp_number, contact.first_name)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Memora;
