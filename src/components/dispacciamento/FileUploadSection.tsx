import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileArchive, Lightbulb, FileText, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function FileUploadSection() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isUploading, setIsUploading] = useState(false);
  
  // Step 1: Letture files
  const [lettureFiles, setLettureFiles] = useState<File[]>([]);
  const [lettureUploaded, setLettureUploaded] = useState(false);
  
  // Step 2: IP files
  const [ipFiles, setIpFiles] = useState<File[]>([]);
  const [ipUploaded, setIpUploaded] = useState(false);
  
  // Step 3: Anagrafica files
  const [anagraficaFiles, setAnagraficaFiles] = useState<File[]>([]);
  const [anagraficaUploaded, setAnagraficaUploaded] = useState(false);
  
  // Step 4: Month selection
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

      let totalExtracted = 0;

      for (const file of lettureFiles) {
        // Upload ZIP file to storage first
        const filePath = `${user.id}/letture/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("dispatch-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Call edge function to extract ZIP recursively
        const { data: extractResult, error: extractError } = await supabase.functions.invoke(
          "dispatch-zip-extractor",
          {
            body: { storageFilePath: filePath },
          }
        );

        if (extractError) {
          console.error("Extraction error:", extractError);
          toast.error(`Errore nell'estrazione di ${file.name}`);
          continue;
        }

        totalExtracted += extractResult.totalFiles || 0;
        console.log(`Extracted ${extractResult.totalFiles} files from ${file.name}`);
      }

      toast.success(`Estratti ${totalExtracted} file dalle letture ZIP`);
      setLettureUploaded(true);
      setStep(2);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadIpFiles = async () => {
    if (ipFiles.length === 0) {
      toast.error("Seleziona almeno un file dell'illuminazione pubblica");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) throw new Error("User not authenticated");
      const user = data.user;

      for (const file of ipFiles) {
        const filePath = `${user.id}/ip/${Date.now()}_${file.name}`;
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

      toast.success(`${ipFiles.length} file illuminazione pubblica caricati`);
      setIpUploaded(true);
      setStep(3);
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

    setIsUploading(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) throw new Error("User not authenticated");
      const user = data.user;

      for (const file of anagraficaFiles) {
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
          });

        if (dbError) throw dbError;
      }

      toast.success(`${anagraficaFiles.length} file anagrafica POD caricati`);
      setAnagraficaUploaded(true);
      setStep(4);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedMonth) {
      toast.error("Seleziona il mese di programmazione");
      return;
    }

    toast.success("Processamento avviato per " + selectedMonth);
    // TODO: Call edge function to start processing
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="grid grid-cols-4 gap-4">
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${step >= 1 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          {lettureUploaded ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <FileArchive className={`w-5 h-5 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <div>
            <p className="text-sm font-medium">1. Letture</p>
            <p className="text-xs text-muted-foreground">File ZIP</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-4 rounded-lg border ${step >= 2 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          {ipUploaded ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Lightbulb className={`w-5 h-5 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <div>
            <p className="text-sm font-medium">2. Illum. Pubblica</p>
            <p className="text-xs text-muted-foreground">File AGGR_IP</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-4 rounded-lg border ${step >= 3 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          {anagraficaUploaded ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <FileText className={`w-5 h-5 ${step === 3 ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <div>
            <p className="text-sm font-medium">3. Anagrafica</p>
            <p className="text-xs text-muted-foreground">Liste POD</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-4 rounded-lg border ${step >= 4 ? 'border-primary bg-primary/5' : 'border-border'}`}>
          <Calendar className={`w-5 h-5 ${step === 4 ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-sm font-medium">4. Mese</p>
            <p className="text-xs text-muted-foreground">Programmazione</p>
          </div>
        </div>
      </div>

      {/* Step 1: Letture */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5" />
              Carica File Letture
            </CardTitle>
            <CardDescription>
              Carica uno o più file ZIP contenenti le letture dei POD (PDO, PDO2G, SOS, S2G)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="flex justify-center">
                <label htmlFor="letture-input" className="cursor-pointer">
                  <div className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                    Seleziona File ZIP
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
                <div className="mt-4 space-y-1">
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

      {/* Step 2: Illuminazione Pubblica */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Carica File Illuminazione Pubblica
            </CardTitle>
            <CardDescription>
              Carica i file AGGR_IP con le curve aggregate dell'illuminazione pubblica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="flex justify-center">
                <label htmlFor="ip-input" className="cursor-pointer">
                  <div className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                    Seleziona File Illuminazione
                  </div>
                  <input
                    id="ip-input"
                    type="file"
                    accept=".csv,.xml,.xlsx,.zip"
                    multiple
                    onChange={(e) => setIpFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
              </div>
              {ipFiles.length > 0 && (
                <div className="mt-4 space-y-1">
                  {ipFiles.map((file, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground text-center">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Indietro
              </Button>
              <Button
                onClick={handleUploadIpFiles}
                disabled={isUploading || ipFiles.length === 0}
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

      {/* Step 3: Anagrafica */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Carica File Anagrafica POD
            </CardTitle>
            <CardDescription>
              Carica i file contenenti le anagrafiche dei POD per ogni zona
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
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
                    onChange={(e) => setAnagraficaFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
              </div>
              {anagraficaFiles.length > 0 && (
                <div className="mt-4 space-y-1">
                  {anagraficaFiles.map((file, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground text-center">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1"
              >
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

      {/* Step 4: Selezione Mese */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Seleziona Mese di Programmazione
            </CardTitle>
            <CardDescription>
              Scegli il mese per cui vuoi calcolare il profilo di dispacciamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(3)}
                variant="outline"
                className="flex-1"
              >
                Indietro
              </Button>
              <Button
                onClick={handleStartProcessing}
                disabled={!selectedMonth}
                className="flex-1"
              >
                Avvia Processamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
