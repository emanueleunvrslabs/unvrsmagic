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
        setError("Invalid link");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .single();

      if (error || !data) {
        setError("User not found");
        setLoading(false);
        return;
      }

      setUserId(data.user_id);
      setLoading(false);
    };

    lookupUser();
  }, [username]);

  // Auto-format date input as DD/MM/YYYY
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    
    // Auto-add slashes
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + "/" + value.slice(5);
    }
    
    setBirthDate(value);
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for database
  const formatDateForDB = (dateStr: string): string | null => {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Error: user not found");
      return;
    }

    if (!firstName || !lastName || !birthDate || !whatsappNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    const formattedDate = formatDateForDB(birthDate);
    if (!formattedDate) {
      toast.error("Please enter a valid date (DD/MM/YYYY)");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("memora_contacts").insert({
      user_id: userId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birth_date: formattedDate,
      whatsapp_number: whatsappNumber.trim(),
    });

    setSubmitting(false);

    if (error) {
      console.error("Error submitting:", error);
      toast.error("Error saving. Please try again.");
    } else {
      setSubmitted(true);
      toast.success("Data saved successfully!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">{error}</h2>
            <p className="text-muted-foreground">The link you followed is invalid or the user doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
              <Check className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Thank you! 🎂</h2>
            <p className="text-muted-foreground">
              Your data has been saved. You'll receive birthday wishes on your next birthday!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border overflow-hidden">
        <CardHeader className="text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto">
            <Cake className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">Memora</CardTitle>
          <p className="text-muted-foreground">
            Enter your details to receive birthday wishes from <span className="text-primary font-medium">@{username}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Date of Birth</Label>
              <Input
                id="birthDate"
                type="text"
                inputMode="numeric"
                value={birthDate}
                onChange={handleDateChange}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+1 234 567 8900"
                required
              />
              <p className="text-xs text-muted-foreground">Include international prefix (e.g. +1)</p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Saving..." : "Save my data"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemoraSubmit;
