import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FileText, RefreshCw, Download, Calendar, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function DelibereArera() {
  const [delibere, setDelibere] = useState<Delibera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadDelibere();
  }, []);

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
        throw new Error(result.error || "Sync failed");
      }

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
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Elaborazione</p>
                  <p className="text-2xl font-bold">
                    {delibere.filter((d) => d.status === "processing").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              <Card key={delibera.id} className="bg-card/30 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          {delibera.delibera_code}
                        </Badge>
                        {getStatusBadge(delibera.status)}
                      </div>
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {delibera.title}
                      </CardTitle>
                      {delibera.publication_date && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(delibera.publication_date), "d MMMM yyyy", { locale: it })}
                        </div>
                      )}
                    </div>
                    {delibera.detail_url && (
                      <a
                        href={delibera.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary */}
                  {delibera.summary && (
                    <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Sommario AI</p>
                      <div className="text-sm whitespace-pre-line">
                        {delibera.summary}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {delibera.files && delibera.files.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        File allegati ({delibera.files.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {delibera.files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {file.name.length > 30 ? `${file.name.slice(0, 30)}...` : file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
