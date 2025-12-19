import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Trash2, MessageCircle, Cake, Gift, Calendar } from "lucide-react";
import { format, differenceInDays, setYear, isToday, isTomorrow, addYears } from "date-fns";
import { it } from "date-fns/locale";

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
        toast.error("Errore nel caricamento dei contatti");
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
            toast.success("Nuovo contatto aggiunto!");
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
    const link = `${window.location.origin}/${username}/memora`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiato negli appunti!");
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from("memora_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Errore nell'eliminazione del contatto");
    } else {
      toast.success("Contatto eliminato");
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
      return <Badge className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white animate-pulse">🎂 Oggi!</Badge>;
    } else if (isTomorrow(nextBirthday)) {
      return <Badge className="bg-orange-500 text-white">Domani</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-yellow-500 text-black">Fra {days} giorni</Badge>;
    } else if (days <= 30) {
      return <Badge variant="secondary">Fra {days} giorni</Badge>;
    }
    return <Badge variant="outline">{days} giorni</Badge>;
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/30">
              <Cake className="h-8 w-8 text-pink-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Memora</h1>
              <p className="text-white/60">Ricorda i compleanni delle persone care</p>
            </div>
          </div>
        </div>

        {/* Share Link Card */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="h-5 w-5 text-pink-400" />
              Il tuo link da condividere
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70">
              Condividi questo link con amici e familiari. Loro potranno inserire la loro data di compleanno e tu riceverai i dati qui.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-white/10 rounded-lg border border-white/20 font-mono text-sm text-white/90 truncate">
                {username ? `${window.location.origin}/${username}/memora` : "Caricamento..."}
              </div>
              <Button onClick={copyLink} disabled={!username} className="bg-pink-500 hover:bg-pink-600">
                <Copy className="h-4 w-4 mr-2" />
                Copia
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Table */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-pink-400" />
              I tuoi contatti ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-white/60">Caricamento...</div>
            ) : sortedContacts.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Cake className="h-16 w-16 mx-auto text-white/20" />
                <p className="text-white/60">Nessun contatto ancora</p>
                <p className="text-white/40 text-sm">
                  Condividi il link con i tuoi amici per iniziare a raccogliere i loro compleanni!
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/70">Nome</TableHead>
                    <TableHead className="text-white/70">Data di nascita</TableHead>
                    <TableHead className="text-white/70">Prossimo compleanno</TableHead>
                    <TableHead className="text-white/70">WhatsApp</TableHead>
                    <TableHead className="text-white/70 text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContacts.map((contact) => (
                    <TableRow key={contact.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">
                        {contact.first_name} {contact.last_name}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {format(new Date(contact.birth_date), "d MMMM yyyy", { locale: it })}
                      </TableCell>
                      <TableCell>
                        {getBirthdayBadge(contact.birth_date)}
                      </TableCell>
                      <TableCell className="text-white/70 font-mono text-sm">
                        {contact.whatsapp_number}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                          onClick={() => sendWhatsApp(contact.whatsapp_number, contact.first_name)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
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
