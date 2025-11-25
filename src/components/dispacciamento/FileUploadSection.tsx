import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, FileArchive, Lightbulb, FileText, Calendar, CheckCircle2, Loader2, AlertTriangle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ALL_ZONES = ['NORD', 'CNOR', 'CSUD', 'SUD', 'CALA', 'SARD', 'SICI'];

// Extract zone from filename (e.g., "NORD_2024-11.csv" -> "NORD")
const extractZoneFromFilename = (filename: string): string | null => {
  const upperFilename = filename.toUpperCase();
  for (const zone of ALL_ZONES) {
    if (upperFilename.includes(zone)) {
      return zone;
    }
  }
  return null;
};

export function FileUploadSection() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [showZoneAlert, setShowZoneAlert] = useState(false);
  
  // Step 1: Letture files
  const [lettureFiles, setLettureFiles] = useState<File[]>([]);
  const [lettureUploaded, setLettureUploaded] = useState(false);
  
  // Step 2: IP aggregated files (AGGR_IP)
  const [ipAggrFiles, setIpAggrFiles] = useState<File[]>([]);
  const [ipAggrUploaded, setIpAggrUploaded] = useState(false);
  
  // Step 3: IP POD detail files (to deduct from anagrafica)
  const [ipDetailFiles, setIpDetailFiles] = useState<File[]>([]);
  const [ipDetailUploaded, setIpDetailUploaded] = useState(false);
  
  // Step 4: Anagrafica files per zone
  const [anagraficaFiles, setAnagraficaFiles] = useState<File[]>([]);
  const [anagraficaUploaded, setAnagraficaUploaded] = useState(false);
  const [detectedZones, setDetectedZones] = useState<string[]>([]);
  
  // Step 5: Month selection
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const handleUploadLettureFiles = async () => {
    if (lettureFiles.length === 0) {
      toast.error("Seleziona almeno un file ZIP delle letture");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) throw new Error("User not authenticated");
      const user = data.user;

      for (const file of lettureFiles) {
        const filePath = `${user.id}/letture/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("dispatch-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("dispatch-files")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("dispatch_files")
          .insert({
            user_id: user.id,
            file_type: "LETTURE",
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            upload_source: "direct",
            status: "uploaded",
            metadata: { 
              original_path: filePath,
              is_zip: file.name.toLowerCase().endsWith('.zip')
            },
          });

        if (dbError) throw dbError;
      }

      toast.success(`${lettureFiles.length} file delle letture caricati`);
      setLettureUploaded(true);
      setStep(2);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadIpAggrFiles = async () => {
    if (ipAggrFiles.length === 0) {
      toast.error("Seleziona almeno un file AGGR_IP");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) throw new Error("User not authenticated");
      const user = data.user;

      for (const file of ipAggrFiles) {
        const filePath = `${user.id}/ip_aggr/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("dispatch-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("dispatch-files")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("dispatch_files")
          .insert({
            user_id: user.id,
            file_type: "AGGR_IP",
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            upload_source: "direct",
            status: "uploaded",
          });

        if (dbError) throw dbError;
      }

      toast.success(`${ipAggrFiles.length} file illuminazione pubblica caricati`);
      setIpAggrUploaded(true);
      setStep(3);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadIpDetailFiles = async () => {
    if (ipDetailFiles.length === 0) {
      toast.error("Seleziona almeno un file dettaglio POD IP");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) throw new Error("User not authenticated");
      const user = data.user;

      for (const file of ipDetailFiles) {
        const filePath = `${user.id}/ip_detail/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("dispatch-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("dispatch-files")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("dispatch_files")
          .insert({
            user_id: user.id,
            file_type: "IP_DETAIL",
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            upload_source: "direct",
            status: "uploaded",
          });

        if (dbError) throw dbError;
      }

      toast.success(`${ipDetailFiles.length} file dettaglio POD IP caricati`);
      setIpDetailUploaded(true);
      setStep(4);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAnagraficaFiles = async () => {
    if (anagraficaFiles.length === 0) {
      toast.error("Seleziona almeno un file anagrafica POD");
      return;
    }

    // Detect zones from filenames
    const zones = new Set<string>();
    for (const file of anagraficaFiles) {
      const zone = extractZoneFromFilename(file.name);
      if (zone) {
        zones.add(zone);
      }
    }
    
    if (zones.size === 0) {
      toast.error("Nessuna zona riconosciuta dai nomi file. Assicurati che i file contengano il nome della zona (es. NORD, CNOR, CSUD, SUD, CALA, SARD, SICI)");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) throw new Error("User not authenticated");
      const user = data.user;

      for (const file of anagraficaFiles) {
        const zone = extractZoneFromFilename(file.name);
        const filePath = `${user.id}/anagrafica/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("dispatch-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("dispatch-files")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("dispatch_files")
          .insert({
            user_id: user.id,
            file_type: "ANAGRAFICA",
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            upload_source: "direct",
            status: "uploaded",
            zone_code: zone,
            metadata: { detected_zone: zone }
          });

        if (dbError) throw dbError;
      }

      const detectedZonesList = Array.from(zones);
      setDetectedZones(detectedZonesList);
      
      toast.success(`${anagraficaFiles.length} file anagrafica caricati per ${zones.size} zone`);
      setAnagraficaUploaded(true);
      setStep(5);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProceedToProcessing = () => {
    if (!selectedMonth) {
      toast.error("Seleziona il mese di programmazione");
      return;
    }

    // Check if all 7 zones are uploaded
    if (detectedZones.length < 7) {
      setShowZoneAlert(true);
    } else {
      startProcessing();
    }
  };

  const startProcessing = async () => {
    setIsUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispatch-orchestrator', {
        body: {
          dispatchMonth: selectedMonth,
          zones: detectedZones
        }
      });

      if (error) throw error;

      toast.success("Elaborazione avviata in background", {
        description: `Elaborazione per ${detectedZones.length} zone: ${detectedZones.join(', ')}`
      });
      
      // Reset form
      setStep(1);
      setLettureFiles([]);
      setLettureUploaded(false);
      setIpAggrFiles([]);
      setIpAggrUploaded(false);
      setIpDetailFiles([]);
      setIpDetailUploaded(false);
      setAnagraficaFiles([]);
      setAnagraficaUploaded(false);
      setDetectedZones([]);
      setSelectedMonth("");
      
    } catch (error) {
      console.error("Error starting processing:", error);
      toast.error("Errore nell'avvio dell'elaborazione");
    } finally {
      setIsUploading(false);
    }
  };

  const missingZones = ALL_ZONES.filter(z => !detectedZones.includes(z));

  return (
    <div className="space-y-6">
      {/* Zone Validation Alert Dialog */}
      <AlertDialog open={showZoneAlert} onOpenChange={setShowZoneAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Zone Mancanti
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Hai caricato solo <strong>{detectedZones.length}</strong> zone su 7 totali.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Zone caricate:</p>
                <div className="flex flex-wrap gap-1">
                  {detectedZones.map(zone => (
                    <Badge key={zone} variant="default" className="bg-green-500/20 text-green-500">
                      {zone}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Zone mancanti:</p>
                <div className="flex flex-wrap gap-1">
                  {missingZones.map(zone => (
                    <Badge key={zone} variant="outline" className="text-amber-500 border-amber-500">
                      {zone}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm">
                Vuoi procedere comunque? I risultati saranno generati solo per le zone caricate.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={startProcessing}>
              Procedi Comunque
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Steps */}
      <div className="grid grid-cols-5 gap-2">
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${step >= 1 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          {lettureUploaded ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <FileArchive className={`w-4 h-4 shrink-0 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">1. Letture</p>
            <p className="text-xs text-muted-foreground truncate">File ZIP</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border ${step >= 2 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          {ipAggrUploaded ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <Lightbulb className={`w-4 h-4 shrink-0 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">2. IP Aggregato</p>
            <p className="text-xs text-muted-foreground truncate">AGGR_IP</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border ${step >= 3 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          {ipDetailUploaded ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <MapPin className={`w-4 h-4 shrink-0 ${step === 3 ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">3. POD IP</p>
            <p className="text-xs text-muted-foreground truncate">Dettaglio</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border ${step >= 4 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          {anagraficaUploaded ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <FileText className={`w-4 h-4 shrink-0 ${step === 4 ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">4. Anagrafica</p>
            <p className="text-xs text-muted-foreground truncate">Per zona</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border ${step >= 5 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          <Calendar className={`w-4 h-4 shrink-0 ${step === 5 ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">5. Elabora</p>
            <p className="text-xs text-muted-foreground truncate">Mese</p>
          </div>
        </div>
      </div>

      {/* Step 1: Letture */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5" />
              Step 1: Carica File Letture
            </CardTitle>
            <CardDescription>
              Carica uno o più file ZIP contenenti le letture dei POD (PDO, PDO2G, SOS, S2G)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                Trascina i file qui o clicca per selezionare
              </p>
              <div className="flex justify-center">
                <label htmlFor="letture-input" className="cursor-pointer">
                  <div className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                    Seleziona uno o più File ZIP
                  </div>
                  <input
                    id="letture-input"
                    type="file"
                    accept=".zip"
                    multiple
                    onChange={(e) => setLettureFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
              </div>
              {lettureFiles.length > 0 && (
                <div className="mt-4 space-y-1 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-center mb-2">{lettureFiles.length} file selezionati:</p>
                  {lettureFiles.map((file, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground text-center">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleUploadLettureFiles}
              disabled={isUploading || lettureFiles.length === 0}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Caricamento...
                </>
              ) : (
                "Carica e Continua"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Illuminazione Pubblica Aggregata */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Step 2: Carica File Illuminazione Pubblica (AGGR_IP)
            </CardTitle>
            <CardDescription>
              Carica i file AGGR_IP con le curve aggregate dell'illuminazione pubblica (96 quarti d'ora)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                Trascina i file qui o clicca per selezionare
              </p>
              <div className="flex justify-center">
                <label htmlFor="ip-aggr-input" className="cursor-pointer">
                  <div className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                    Seleziona File AGGR_IP
                  </div>
                  <input
                    id="ip-aggr-input"
                    type="file"
                    accept=".csv,.xml,.xlsx,.zip"
                    multiple
                    onChange={(e) => setIpAggrFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
              </div>
              {ipAggrFiles.length > 0 && (
                <div className="mt-4 space-y-1 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-center mb-2">{ipAggrFiles.length} file selezionati:</p>
                  {ipAggrFiles.map((file, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground text-center">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                Indietro
              </Button>
              <Button
                onClick={handleUploadIpAggrFiles}
                disabled={isUploading || ipAggrFiles.length === 0}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  "Carica e Continua"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Dettaglio POD IP */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Step 3: Carica Dettaglio POD Illuminazione Pubblica
            </CardTitle>
            <CardDescription>
              Carica i file con l'elenco dei POD di illuminazione pubblica. Questi POD verranno esclusi dalle anagrafiche dello Step 4 (sono già conteggiati nei file AGGR_IP).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>Importante:</strong> I POD elencati in questi file verranno automaticamente rimossi dalle anagrafiche per evitare duplicazioni nel conteggio dell'illuminazione pubblica.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                Trascina i file qui o clicca per selezionare
              </p>
              <div className="flex justify-center">
                <label htmlFor="ip-detail-input" className="cursor-pointer">
                  <div className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                    Seleziona File Dettaglio POD IP
                  </div>
                  <input
                    id="ip-detail-input"
                    type="file"
                    accept=".csv,.xml,.xlsx"
                    multiple
                    onChange={(e) => setIpDetailFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
              </div>
              {ipDetailFiles.length > 0 && (
                <div className="mt-4 space-y-1 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-center mb-2">{ipDetailFiles.length} file selezionati:</p>
                  {ipDetailFiles.map((file, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground text-center">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                Indietro
              </Button>
              <Button
                onClick={handleUploadIpDetailFiles}
                disabled={isUploading || ipDetailFiles.length === 0}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  "Carica e Continua"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Anagrafica per Zona */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Step 4: Carica File Anagrafica POD per Zona
            </CardTitle>
            <CardDescription>
              Carica i file anagrafica per ogni zona. Il sistema riconoscerà automaticamente la zona dal nome del file (es. NORD_2024-11.csv, CSUD_anagrafica.csv)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Zone supportate:</strong> {ALL_ZONES.join(', ')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                I file devono contenere il nome della zona nel filename
              </p>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                Trascina i file qui o clicca per selezionare
              </p>
              <div className="flex justify-center">
                <label htmlFor="anagrafica-input" className="cursor-pointer">
                  <div className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                    Seleziona File Anagrafica
                  </div>
                  <input
                    id="anagrafica-input"
                    type="file"
                    accept=".csv,.xml,.xlsx,.zip"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setAnagraficaFiles(files);
                      
                      // Preview detected zones
                      const zones = new Set<string>();
                      for (const file of files) {
                        const zone = extractZoneFromFilename(file.name);
                        if (zone) zones.add(zone);
                      }
                      setDetectedZones(Array.from(zones));
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {anagraficaFiles.length > 0 && (
                <div className="mt-4 space-y-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-center">{anagraficaFiles.length} file selezionati:</p>
                  {anagraficaFiles.map((file, idx) => {
                    const zone = extractZoneFromFilename(file.name);
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[200px]">{file.name}</span>
                        {zone ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-500">
                            {zone}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Zona non riconosciuta</Badge>
                        )}
                      </div>
                    );
                  })}
                  {detectedZones.length > 0 && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Zone rilevate: {detectedZones.join(', ')} ({detectedZones.length}/7)
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                Indietro
              </Button>
              <Button
                onClick={handleUploadAnagraficaFiles}
                disabled={isUploading || anagraficaFiles.length === 0}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  "Carica e Continua"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Selezione Mese e Avvio */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Step 5: Seleziona Mese e Avvia Elaborazione
            </CardTitle>
            <CardDescription>
              Scegli il mese per cui vuoi calcolare il profilo di dispacciamento. Il sistema genererà un file CSV per ogni zona caricata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zone Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Zone da elaborare:</span>
                <Badge variant={detectedZones.length === 7 ? "default" : "secondary"}>
                  {detectedZones.length}/7 zone
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {ALL_ZONES.map(zone => (
                  <Badge 
                    key={zone} 
                    variant={detectedZones.includes(zone) ? "default" : "outline"}
                    className={detectedZones.includes(zone) 
                      ? "bg-green-500/20 text-green-500" 
                      : "text-muted-foreground"
                    }
                  >
                    {zone}
                  </Badge>
                ))}
              </div>
              {detectedZones.length < 7 && (
                <p className="text-xs text-amber-500">
                  Alcune zone non sono state caricate. Verrà mostrato un avviso prima dell'elaborazione.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mese di Programmazione</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                Il sistema userà automaticamente i dati storici del mese T-12
              </p>
            </div>

            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm">
                <strong>Output:</strong> Verranno generati {detectedZones.length} file CSV (uno per zona) nel formato AGGR_IP con curva a 96 valori.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(4)} variant="outline" className="flex-1">
                Indietro
              </Button>
              <Button
                onClick={handleProceedToProcessing}
                disabled={isUploading || !selectedMonth}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Avvio in corso...
                  </>
                ) : (
                  "Avvia Elaborazione"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
