import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cake, Check, AlertCircle } from "lucide-react";

const MemoraSubmit = () => {
  const { username } = useParams<{ username: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Lookup user_id from username
  useEffect(() => {
    const lookupUser = async () => {
      if (!username) {
        setError("Link non valido");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .single();

      if (error || !data) {
        setError("Utente non trovato");
        setLoading(false);
        return;
      }

      setUserId(data.user_id);
      setLoading(false);
    };

    lookupUser();
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Errore: utente non trovato");
      return;
    }

    if (!firstName || !lastName || !birthDate || !whatsappNumber) {
      toast.error("Compila tutti i campi");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("memora_contacts").insert({
      user_id: userId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birth_date: birthDate,
      whatsapp_number: whatsappNumber.trim(),
    });

    setSubmitting(false);

    if (error) {
      console.error("Error submitting:", error);
      toast.error("Errore nel salvataggio. Riprova.");
    } else {
      setSubmitted(true);
      toast.success("Dati salvati con successo!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-pink-950/20 flex items-center justify-center p-4">
        <div className="text-white/60">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-pink-950/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-16 w-16 mx-auto text-red-400" />
            <h2 className="text-xl font-semibold text-white">{error}</h2>
            <p className="text-white/60">Il link che hai seguito non è valido o l'utente non esiste.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-pink-950/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="p-4 rounded-full bg-green-500/20 w-fit mx-auto">
              <Check className="h-12 w-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Grazie! 🎂</h2>
            <p className="text-white/70">
              I tuoi dati sono stati salvati. Riceverai gli auguri al tuo prossimo compleanno!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-pink-950/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/30 w-fit mx-auto">
            <Cake className="h-10 w-10 text-pink-400" />
          </div>
          <CardTitle className="text-2xl text-white">Memora</CardTitle>
          <p className="text-white/60">
            Inserisci i tuoi dati per ricevere gli auguri di compleanno da <span className="text-pink-400 font-medium">@{username}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white/80">Nome</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mario"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white/80">Cognome</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rossi"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-white/80">Data di nascita</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-white/80">Numero WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+39 123 456 7890"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                required
              />
              <p className="text-xs text-white/50">Includi il prefisso internazionale (es. +39)</p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white"
            >
              {submitting ? "Salvataggio..." : "Salva i miei dati"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemoraSubmit;
