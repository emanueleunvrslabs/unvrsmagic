import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { 
  MessageCircle, 
  Users, 
  Download, 
  RefreshCw, 
  LogIn, 
  LogOut,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Crown
} from "lucide-react";

interface TelegramUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phone?: string;
}

interface TelegramGroup {
  id: string;
  title: string;
  username?: string;
  participantsCount?: number;
  isChannel: boolean;
  isGroup: boolean;
  isMegagroup: boolean;
}

interface ScrapedMember {
  telegram_user_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_bot: boolean;
  is_premium: boolean;
}

export default function TelegramScraper() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [authStep, setAuthStep] = useState<'phone' | 'code' | '2fa' | 'done'>('phone');
  
  // Auth form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password2FA, setPassword2FA] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [tempSessionString, setTempSessionString] = useState('');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  
  // Data state
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [members, setMembers] = useState<ScrapedMember[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Check session on mount
  useEffect(() => {
    if (user) {
      checkSession();
    }
  }, [user]);

  const checkSession = async () => {
    setIsCheckingSession(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-mtproto-auth', {
        body: { action: 'checkSession' }
      });

      if (error) throw error;

      if (data?.hasActiveSession) {
        setIsAuthenticated(true);
        setTelegramUser(data.user);
        setAuthStep('done');
        // Load groups
        loadGroups();
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const sendCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Inserisci il numero di telefono');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-mtproto-auth', {
        body: { 
          action: 'sendCode',
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        setPhoneCodeHash(data.phoneCodeHash);
        setTempSessionString(data.sessionString);
        setAuthStep('code');
        toast.success('Codice inviato! Controlla Telegram');
      } else {
        throw new Error(data?.error || 'Errore invio codice');
      }
    } catch (error: any) {
      console.error('Send code error:', error);
      toast.error(error.message || 'Errore invio codice');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    if (!verificationCode.trim()) {
      toast.error('Inserisci il codice di verifica');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-mtproto-auth', {
        body: { 
          action: 'signIn',
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
          phoneCode: {
            code: verificationCode,
            hash: phoneCodeHash
          },
          sessionString: tempSessionString
        }
      });

      if (error) throw error;

      if (data?.needs2FA) {
        setTempSessionString(data.sessionString);
        setAuthStep('2fa');
        toast.info('Richiesta verifica 2FA');
      } else if (data?.success) {
        setIsAuthenticated(true);
        setTelegramUser(data.user);
        setAuthStep('done');
        toast.success('Login effettuato!');
        loadGroups();
      } else {
        throw new Error(data?.error || 'Errore login');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Errore login');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn2FA = async () => {
    if (!password2FA.trim()) {
      toast.error('Inserisci la password 2FA');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-mtproto-auth', {
        body: { 
          action: 'signIn2FA',
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
          password: password2FA,
          sessionString: tempSessionString
        }
      });

      if (error) throw error;

      if (data?.success) {
        setIsAuthenticated(true);
        setTelegramUser(data.user);
        setAuthStep('done');
        toast.success('Login effettuato!');
        loadGroups();
      } else {
        throw new Error(data?.error || 'Errore 2FA');
      }
    } catch (error: any) {
      console.error('2FA error:', error);
      toast.error(error.message || 'Password 2FA errata');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.functions.invoke('telegram-mtproto-auth', {
        body: { action: 'logout' }
      });

      setIsAuthenticated(false);
      setTelegramUser(null);
      setAuthStep('phone');
      setGroups([]);
      setMembers([]);
      setPhoneNumber('');
      setVerificationCode('');
      setPassword2FA('');
      toast.success('Logout effettuato');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Errore logout');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-mtproto-scrape', {
        body: { action: 'getDialogs' }
      });

      if (error) throw error;

      if (data?.success) {
        setGroups(data.groups);
      }
    } catch (error: any) {
      console.error('Load groups error:', error);
      toast.error(error.message || 'Errore caricamento gruppi');
    } finally {
      setIsLoading(false);
    }
  };

  const scrapeMembers = async (group: TelegramGroup) => {
    setIsScraping(true);
    setSelectedGroup(group);
    setMembers([]);

    try {
      const { data, error } = await supabase.functions.invoke('telegram-mtproto-scrape', {
        body: { 
          action: 'scrapeMembers',
          groupId: group.id,
          groupUsername: group.username,
          limit: 500
        }
      });

      if (error) throw error;

      if (data?.floodWait) {
        toast.error(`Rate limit! Attendi ${data.floodWait} secondi`);
        return;
      }

      if (data?.success) {
        setMembers(data.members);
        toast.success(`Trovati ${data.membersCount} membri`);
      }
    } catch (error: any) {
      console.error('Scrape error:', error);
      toast.error(error.message || 'Errore scraping');
    } finally {
      setIsScraping(false);
    }
  };

  const exportToCSV = () => {
    if (members.length === 0) {
      toast.error('Nessun membro da esportare');
      return;
    }

    const headers = ['User ID', 'Username', 'Nome', 'Cognome', 'Telefono', 'Bot', 'Premium'];
    const rows = members.map(m => [
      m.telegram_user_id,
      m.username || '',
      m.first_name || '',
      m.last_name || '',
      m.phone || '',
      m.is_bot ? 'Sì' : 'No',
      m.is_premium ? 'Sì' : 'No'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telegram_members_${selectedGroup?.title || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Export completato');
  };

  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.username?.toLowerCase().includes(query) ||
      m.first_name?.toLowerCase().includes(query) ||
      m.last_name?.toLowerCase().includes(query) ||
      m.telegram_user_id.includes(query)
    );
  });

  if (authLoading || isCheckingSession) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-primary" />
              Telegram Scraper
            </h1>
            <p className="text-muted-foreground mt-1">
              Estrai membri da gruppi e supergruppi Telegram via MTProto
            </p>
          </div>

          {isAuthenticated && telegramUser && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">
                  {telegramUser.firstName} {telegramUser.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{telegramUser.username || telegramUser.phone}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={logout} disabled={isLoading}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>

        {!isAuthenticated ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Autenticazione Telegram
              </CardTitle>
              <CardDescription>
                Accedi con il tuo account Telegram per iniziare lo scraping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authStep === 'phone' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Numero di telefono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+39 123 456 7890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Inserisci il numero con prefisso internazionale
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={sendCode}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    Invia codice
                  </Button>
                </>
              )}

              {authStep === 'code' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="code">Codice di verifica</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="12345"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Inserisci il codice ricevuto su Telegram
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={signIn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Verifica
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setAuthStep('phone')}
                  >
                    Torna indietro
                  </Button>
                </>
              )}

              {authStep === '2fa' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password 2FA</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="La tua password cloud"
                      value={password2FA}
                      onChange={(e) => setPassword2FA(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Inserisci la password di verifica in due passaggi
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={signIn2FA}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Conferma
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="groups" className="space-y-4">
            <TabsList>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gruppi ({groups.length})
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Membri ({members.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">I tuoi gruppi</h2>
                <Button onClick={loadGroups} disabled={isLoading} variant="outline" size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Aggiorna
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <Card key={group.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {group.title}
                        {group.isChannel && (
                          <Badge variant="secondary" className="text-xs">Canale</Badge>
                        )}
                        {group.isMegagroup && (
                          <Badge variant="outline" className="text-xs">Supergruppo</Badge>
                        )}
                      </CardTitle>
                      {group.username && (
                        <CardDescription>@{group.username}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {group.participantsCount?.toLocaleString() || '?'} membri
                        </span>
                        <Button 
                          size="sm"
                          onClick={() => scrapeMembers(group)}
                          disabled={isScraping}
                        >
                          {isScraping && selectedGroup?.id === group.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Scrape
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {groups.length === 0 && !isLoading && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun gruppo trovato</p>
                    <p className="text-sm">Assicurati di essere membro di gruppi o supergruppi</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedGroup ? `Membri di ${selectedGroup.title}` : 'Membri'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredMembers.length} di {members.length} membri
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Button 
                    onClick={exportToCSV} 
                    disabled={members.length === 0}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.telegram_user_id}>
                        <TableCell className="font-mono text-sm">
                          {member.telegram_user_id}
                        </TableCell>
                        <TableCell>
                          {member.username ? (
                            <span className="text-primary">@{member.username}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.first_name} {member.last_name}
                        </TableCell>
                        <TableCell>
                          {member.phone || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {member.is_bot && (
                              <Badge variant="secondary" className="gap-1">
                                <Bot className="h-3 w-3" />
                                Bot
                              </Badge>
                            )}
                            {member.is_premium && (
                              <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500">
                                <Crown className="h-3 w-3" />
                                Premium
                              </Badge>
                            )}
                            {!member.is_bot && !member.is_premium && (
                              <span className="text-muted-foreground text-sm">Utente</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          {members.length === 0 
                            ? 'Seleziona un gruppo e clicca "Scrape" per estrarre i membri'
                            : 'Nessun risultato per la ricerca'
                          }
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
