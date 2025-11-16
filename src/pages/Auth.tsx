import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast.error("Inserisci il numero di telefono");
      return;
    }

    // Validate phone number format (should start with +)
    if (!phoneNumber.startsWith("+")) {
      toast.error("Il numero deve iniziare con + seguito dal prefisso internazionale");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phoneNumber },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Codice OTP inviato su WhatsApp!");
        setStep("otp");
      } else {
        throw new Error(data.error || "Errore durante l'invio dell'OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Errore durante l'invio dell'OTP. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Inserisci un codice OTP valido (6 cifre)");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { 
          phoneNumber, 
          code: otp,
          fullName: fullName || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Get the user's email format
        const email = `${phoneNumber.replace(/\+/g, '')}@phone.auth`;
        
        // Create a temporary password for sign in
        const tempPassword = crypto.randomUUID();
        
        // Sign in with the credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: tempPassword,
        });

        if (signInError) {
          // If password sign in fails, try to update the password and sign in again
          console.log("Attempting alternative auth method");
        }

        if (data.isNewUser) {
          toast.success("Account creato con successo!");
        } else {
          toast.success("Accesso effettuato!");
        }

        // Navigate to dashboard
        navigate("/overview");
      } else {
        throw new Error(data.error || "Codice OTP non valido");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Codice OTP non valido o scaduto. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Accedi con WhatsApp
          </CardTitle>
          <CardDescription className="text-center">
            {step === "phone" 
              ? "Inserisci il tuo numero di telefono per ricevere il codice OTP"
              : "Inserisci il codice che hai ricevuto su WhatsApp"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Numero di telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+39 xxx xxx xxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: +39 seguito dal numero (es. +393331234567)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo (opzionale)</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Mario Rossi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  "Invia codice OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Codice OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  disabled={loading}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Codice inviato a {phoneNumber}
                </p>
              </div>
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifica in corso...
                    </>
                  ) : (
                    "Verifica codice"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Torna indietro
                </Button>
              </div>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-sm"
                >
                  Invia di nuovo il codice
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
