import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FileText, RefreshCw, Download, Clock, Terminal, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { DeliberaCard } from "@/components/arera/DeliberaCard";
import { useUserRole } from "@/hooks/useUserRole";
import "@/components/labs/SocialMediaCard.css";

interface DeliberaFile {
  name: string;
  url: string;
  originalUrl?: string;
}

interface Delibera {
  id: string;
  delibera_code: string;
  publication_date: string | null;
  title: string;
  description: string | null;
  summary: string | null;
  detail_url: string | null;
  files: DeliberaFile[];
  status: string;
  created_at: string;
}

interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'processing';
}

export default function DelibereArera() {
  const [delibere, setDelibere] = useState<Delibera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { isOwner, isAdmin } = useUserRole();
  const [isAutoSendModalOpen, setIsAutoSendModalOpen] = useState(false);
  const [autoSendEmail, setAutoSendEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  
  const isAdminUser = isOwner || isAdmin;

  const handleSaveAutoSendEmail = async () => {
    if (!autoSendEmail || !autoSendEmail.includes("@")) {
      toast.error("Inserisci un indirizzo email valido");
      return;
    }
    
    setIsSavingEmail(true);
    try {
      // TODO: Save email to database
      toast.success(`Email configurata: ${autoSendEmail}`);
      setIsAutoSendModalOpen(false);
    } catch (error) {
      toast.error("Errore nel salvataggio dell'email");
    } finally {
      setIsSavingEmail(false);
    }
  };

  useEffect(() => {
    loadDelibere();
    
    // Subscribe to realtime changes on arera_delibere table
    const channel = supabase
      .channel('arera-delibere-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arera_delibere'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newDelibera = payload.new as any;
            addLog(`📄 Nuova delibera: ${newDelibera.delibera_code} - ${newDelibera.title?.slice(0, 50)}...`, 'info');
            
            setDelibere(prev => {
              const typed = {
                ...newDelibera,
                files: (newDelibera.files as unknown as DeliberaFile[]) || []
              };
              return [typed, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            
            if (updated.status === 'completed') {
              addLog(`✅ Completata: ${updated.delibera_code} - ${(updated.files as any[])?.length || 0} file scaricati`, 'success');
            } else if (updated.status === 'error') {
              addLog(`❌ Errore: ${updated.delibera_code} - ${updated.error_message || 'Errore sconosciuto'}`, 'error');
            } else if (updated.status === 'processing') {
              addLog(`⏳ Elaborazione: ${updated.delibera_code}...`, 'processing');
            }
            
            if (updated.summary && !payload.old?.summary) {
              addLog(`🤖 Sommario AI generato per ${updated.delibera_code}`, 'success');
            }
            
            setDelibere(prev => prev.map(d => 
              d.id === updated.id 
                ? { ...updated, files: (updated.files as unknown as DeliberaFile[]) || [] }
                : d
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date(), message, type }]);
  };

  const loadDelibere = async () => {
    try {
      const { data, error } = await supabase
        .from("arera_delibere")
        .select("*")
        .order("publication_date", { ascending: false });

      if (error) throw error;
      
      // Type assertion for files field
      const typedDelibere = (data || []).map(d => ({
        ...d,
        files: (d.files as unknown as DeliberaFile[]) || []
      }));
      
      setDelibere(typedDelibere);
    } catch (error) {
      console.error("Error loading delibere:", error);
      toast.error("Errore nel caricamento delle delibere");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setLogs([]); // Clear previous logs
    addLog('🚀 Avvio sincronizzazione ARERA...', 'info');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/arera-scraper`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        addLog(`❌ Errore: ${result.error || 'Sync failed'}`, 'error');
        throw new Error(result.error || "Sync failed");
      }

      addLog(`🎉 Sincronizzazione completata: ${result.newProcessed} nuove delibere elaborate`, 'success');
      toast.success(`Sincronizzazione completata: ${result.newProcessed} nuove delibere`);
      loadDelibere();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Errore durante la sincronizzazione");
    } finally {
      setIsSyncing(false);
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'processing': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const processingCount = delibere.filter((d) => d.status === "processing").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Delibere ARERA</h1>
              <p className="text-muted-foreground mt-1">
                {isAdminUser 
                  ? "Gestione automatica delibere ARERA con sommari AI"
                  : "Consulta le delibere ARERA con sommari AI"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAutoSendModalOpen(true)} className="gap-2">
              <Mail className="h-4 w-4" />
              Invio automatico
            </Button>
            {isAdminUser && (
              <Button onClick={handleSync} disabled={isSyncing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sincronizzazione..." : "Sincronizza"}
              </Button>
            )}
          </div>
        </div>

        {/* Stats - Admin only */}
        {isAdminUser && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="social-media-card" style={{ width: '100%', height: 'auto', minHeight: 'auto', flexDirection: 'column', cursor: 'default' }}>
              <div className="flex items-center gap-3 p-5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Totale Delibere</p>
                  <p className="text-2xl font-bold text-white">{delibere.length}</p>
                </div>
              </div>
            </div>
            <div className="social-media-card" style={{ width: '100%', height: 'auto', minHeight: 'auto', flexDirection: 'column', cursor: 'default' }}>
              <div className="flex items-center gap-3 p-5">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Download className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">File Scaricati</p>
                  <p className="text-2xl font-bold text-white">
                    {delibere.reduce((acc, d) => acc + (d.files?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="social-media-card" style={{ width: '100%', height: 'auto', minHeight: 'auto', flexDirection: 'column', cursor: 'default' }}>
              <div className="flex items-center gap-3 p-5">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className={`h-5 w-5 text-yellow-400 ${processingCount > 0 ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">In Elaborazione</p>
                  <p className="text-2xl font-bold text-white">{processingCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Log Panel - Admin only, show when syncing or has logs */}
        {isAdminUser && (isSyncing || logs.length > 0) && (
          <div className="social-media-card" style={{ width: '100%', height: 'auto', minHeight: 'auto', flexDirection: 'column', cursor: 'default' }}>
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <Terminal className={`h-5 w-5 text-primary ${isSyncing ? 'animate-pulse' : ''}`} />
              <h3 className="text-lg font-semibold text-white">Log di Elaborazione</h3>
              {isSyncing && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse">
                  In corso...
                </span>
              )}
            </div>
            <div className="px-5 pb-5">
              <div className="h-[200px] w-full rounded-lg bg-black/30 border border-white/10 p-3 font-mono text-sm overflow-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-400">In attesa di eventi...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`py-1 ${getLogColor(log.type)}`}>
                      <span className="text-gray-500 mr-2">
                        [{format(log.timestamp, 'HH:mm:ss')}]
                      </span>
                      {log.message}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* Delibere List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="bg-card/30 backdrop-blur-sm border-border/50">
              <CardContent className="py-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Caricamento delibere...</p>
              </CardContent>
            </Card>
          ) : delibere.length === 0 ? (
            <Card className="bg-card/30 backdrop-blur-sm border-border/50">
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Nessuna delibera presente. Clicca "Sincronizza" per scaricare le delibere ARERA.
                </p>
              </CardContent>
            </Card>
          ) : (
            delibere.map((delibera) => (
              <DeliberaCard key={delibera.id} delibera={delibera} />
            ))
          )}
        </div>
      </div>

      {/* Modal Invio Automatico */}
      <Dialog open={isAutoSendModalOpen} onOpenChange={setIsAutoSendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invio automatico delibere</DialogTitle>
            <DialogDescription>
              Inserisci l'indirizzo email dove vuoi ricevere automaticamente le nuove delibere ARERA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="esempio@email.com"
                value={autoSendEmail}
                onChange={(e) => setAutoSendEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAutoSendModalOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveAutoSendEmail} disabled={isSavingEmail}>
              {isSavingEmail ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
