import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import logo from "@/assets/landing/unvrs-logo.png";
import { MorseLED } from "@/components/MorseLED";

export default function Auth() {
  const navigate = useNavigate();
  const { isOwner } = useUserRole();
  const [step, setStep] = useState<"phone" | "otp" | "username">("phone");
  const [countryCode, setCountryCode] = useState("+34");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check user role and redirect accordingly
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (roleData?.role === 'owner') {
          navigate("/admin/dashboard");
        } else {
          navigate("/marketplace");
        }
      }
    };
    checkSession();
  }, [navigate]);

  // Auto-verify OTP when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && step === "otp" && !loading) {
      handleVerifyOtp(new Event("submit") as any);
    }
  }, [otp]);

  // Auto-send OTP when phone number is complete
  useEffect(() => {
    if (step === "phone" && !loading && phoneNumber.length > 0) {
      const requiredLength = countryCode === "+34" ? 9 : countryCode === "+39" ? 10 : 10;
      if (phoneNumber.length === requiredLength) {
        handleSendOtp(new Event("submit") as any);
      }
    }
  }, [phoneNumber, countryCode]);

  // Check username availability in real-time
  useEffect(() => {
    if (step === "username" && username.length >= 3) {
      const checkUsername = async () => {
        setCheckingUsername(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username.toLowerCase())
            .maybeSingle();

          if (error) {
            console.error('Error checking username:', error);
            setUsernameAvailable(null);
            return;
          }

          setUsernameAvailable(!data);
        } catch (error) {
          console.error('Error checking username:', error);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      };

      const timer = setTimeout(checkUsername, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, step]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!phoneNumber) {
      toast.error("Please enter phone number");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phoneNumber: fullPhoneNumber },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("OTP code sent on WhatsApp!");
        setStep("otp");
      } else {
        throw new Error(data.error || "Error sending OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Error sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid OTP code (6 digits)");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { 
          phoneNumber: fullPhoneNumber, 
          code: otp,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Sign in with the temporary password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.tempPassword,
        });

        if (signInError) {
          console.error("Sign in error:", signInError);
          throw new Error("Failed to sign in");
        }

        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          // Check if user has username
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profile?.username) {
            // User already has username, go to dashboard
            toast.success("Login successful!");
            
            // Check user role and redirect accordingly
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .single();
            
            if (roleData?.role === 'owner') {
              navigate("/admin/dashboard");
            } else {
              navigate("/marketplace");
            }
          } else {
            // New user or user without username, go to username step
            setStep("username");
            if (data.isNewUser) {
              toast.success("Account created! Please choose your username.");
            } else {
              toast.success("Please set your username.");
            }
          }
        }
      } else {
        throw new Error(data.error || "Invalid OTP code");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Invalid or expired OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "username") {
      setStep("phone");
      setPhoneNumber("");
      setOtp("");
      setUsername("");
    } else {
      setStep("phone");
      setOtp("");
    }
  };

  const handleSubmitUsername = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (usernameAvailable === false) {
      toast.error("Username already taken");
      return;
    }

    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      // Update profile with username
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('user_id', userId);

      if (error) {
        if (error.code === '23505') {
          toast.error("Username already taken. Please choose another.");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Username set successfully!");
      
      // Check user role and redirect accordingly
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleData?.role === 'owner') {
        navigate("/admin/dashboard");
      } else {
        navigate("/marketplace");
      }
    } catch (error) {
      console.error("Error setting username:", error);
      toast.error("Error setting username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <header className="fixed top-6 left-6 z-50 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12">
            <img src={logo} alt="Unvrs Labs" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-orbitron font-semibold tracking-tight text-white transition-opacity group-hover:opacity-80">
            UNVRS LABS
          </span>
        </Link>
      </header>
      <Card className="w-full max-w-sm relative">
        <MorseLED />
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center font-orbitron">
            {step === "username" ? "Choose Username" : "Login with WhatsApp"}
          </CardTitle>
          <CardDescription className="text-center font-orbitron">
            {step === "phone" 
              ? "Enter your phone number to receive the OTP code"
              : step === "otp"
              ? "Enter the code you received on WhatsApp"
              : "Choose a unique username for your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Phone number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+34">🇪🇸 +34</SelectItem>
                      <SelectItem value="+39">🇮🇹 +39</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={countryCode === "+34" ? "612345678" : "3331234567"}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    required
                    disabled={loading}
                    className="flex-1"
                    maxLength={countryCode === "+34" ? 9 : 10}
                    autoFocus
                  />
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Sending code...
                  </div>
                )}
              </div>
            </div>
          ) : step === "otp" ? (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Code sent to {countryCode}{phoneNumber}
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleBack}
                  disabled={loading}
                  className="text-sm underline"
                >
                  Change number
                </Button>
              </div>
              
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              )}

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive the code?
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-sm"
                >
                  Resend Code
                </Button>
              </div>
            </div>
          ) : step === "username" ? (
            <form onSubmit={handleSubmitUsername} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    required
                    disabled={loading}
                    minLength={3}
                    maxLength={20}
                    autoFocus
                    className="pr-10"
                  />
                  {username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingUsername ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : usernameAvailable === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : usernameAvailable === false ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {username.length >= 3 && usernameAvailable === false
                    ? "Username already taken"
                    : "3-20 characters, lowercase, no spaces"}
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary/80 hover:bg-primary/90" 
                disabled={loading || checkingUsername || usernameAvailable === false}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting username...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
