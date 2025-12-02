import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FileText, RefreshCw, Download, Calendar, ExternalLink, Clock, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Completata</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">In elaborazione</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">Errore</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/30">In attesa</Badge>;
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
                Gestione automatica delibere ARERA con sommari AI
              </p>
            </div>
          </div>
          <Button onClick={handleSync} disabled={isSyncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizzazione..." : "Sincronizza"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totale Delibere</p>
                  <p className="text-2xl font-bold">{delibere.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Download className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">File Scaricati</p>
                  <p className="text-2xl font-bold">
                    {delibere.reduce((acc, d) => acc + (d.files?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className={`h-5 w-5 text-yellow-400 ${processingCount > 0 ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Elaborazione</p>
                  <p className="text-2xl font-bold">{processingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Log Panel - Show when syncing or has logs */}
        {(isSyncing || logs.length > 0) && (
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Terminal className={`h-5 w-5 text-primary ${isSyncing ? 'animate-pulse' : ''}`} />
                <CardTitle className="text-lg">Log di Elaborazione</CardTitle>
                {isSyncing && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 animate-pulse">
                    In corso...
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-lg bg-background/50 border border-border/30 p-3 font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">In attesa di eventi...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`py-1 ${getLogColor(log.type)}`}>
                      <span className="text-muted-foreground mr-2">
                        [{format(log.timestamp, 'HH:mm:ss')}]
                      </span>
                      {log.message}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </ScrollArea>
            </CardContent>
          </Card>
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
              <Card key={delibera.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div>
                    <h3 className="font-medium">{delibera.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      {/* Code Badge */}
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-primary/10 text-primary border-primary/20">
                        {delibera.delibera_code}
                      </span>
                      
                      {/* Status Badge */}
                      {delibera.status === "completed" && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-green-500/10 text-green-400 border-green-500/20">
                          ✓ Completata
                        </span>
                      )}
                      {delibera.status === "processing" && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse">
                          ⏳ In elaborazione
                        </span>
                      )}
                      {delibera.status === "error" && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-red-500/10 text-red-400 border-red-500/20">
                          ✗ Errore
                        </span>
                      )}
                      
                      {/* Date Badge */}
                      {delibera.publication_date && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-blue-500/10 text-blue-400 border-blue-500/20">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(delibera.publication_date), "d MMM yyyy", { locale: it })}
                        </span>
                      )}
                      
                      {/* Files Badge */}
                      {delibera.files && delibera.files.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-purple-500/10 text-purple-400 border-purple-500/20">
                          <Download className="h-3 w-3" />
                          {delibera.files.length} file
                        </span>
                      )}
                      
                      {/* External Link */}
                      {delibera.detail_url && (
                        <a
                          href={delibera.detail_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-white/5 text-white/70 border-white/10 hover:bg-white/10 transition-colors ml-auto"
                        >
                          <ExternalLink className="h-3 w-3" />
                          ARERA
                        </a>
                      )}
                    </div>
                    
                    {/* Summary */}
                    {delibera.summary && (
                      <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-white/70 whitespace-pre-line line-clamp-3">{delibera.summary}</p>
                      </div>
                    )}
                    
                    {/* Files List */}
                    {delibera.files && delibera.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {delibera.files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            {file.name.length > 25 ? `${file.name.slice(0, 25)}...` : file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
