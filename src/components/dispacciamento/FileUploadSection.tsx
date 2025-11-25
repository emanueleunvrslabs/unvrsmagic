import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ZONES = [
  { code: "NORD", name: "Nord" },
  { code: "CNOR", name: "Centro Nord" },
  { code: "CSUD", name: "Centro Sud" },
  { code: "SUD", name: "Sud" },
  { code: "CALA", name: "Calabria" },
  { code: "SARD", name: "Sardegna" },
  { code: "SICI", name: "Sicilia" },
];

const FILE_TYPES = [
  { value: "PDO", label: "PDO - Letture POD" },
  { value: "PDO2G", label: "PDO2G - Letture POD 2G" },
  { value: "SOS", label: "SOS - Curve SOS" },
  { value: "S2G", label: "S2G - Curve S2G" },
  { value: "AGGR_IP", label: "AGGR_IP - Illuminazione Pubblica" },
  { value: "ANAGRAFICA", label: "ANAGRAFICA - Anagrafica POD" },
];

export function FileUploadSection() {
  const [uploadMode, setUploadMode] = useState<"direct" | "url">("direct");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedFileType, setSelectedFileType] = useState<string>("");
  const [monthReference, setMonthReference] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDirectUpload = async () => {
    if (!selectedFile || !selectedZone || !selectedFileType || !monthReference) {
      toast.error("Compila tutti i campi richiesti");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Upload file to storage
      const filePath = `${user.id}/${selectedZone}/${selectedFileType}/${monthReference}/${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("dispatch-files")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("dispatch-files")
        .getPublicUrl(filePath);

      // Save file metadata
      const { error: dbError } = await supabase
        .from("dispatch_files")
        .insert({
          user_id: user.id,
          zone_code: selectedZone,
          file_type: selectedFileType,
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_size: selectedFile.size,
          upload_source: "direct",
          month_reference: monthReference,
          status: "uploaded",
        });

      if (dbError) throw dbError;

      toast.success("File caricato con successo");
      setSelectedFile(null);
      setSelectedZone("");
      setSelectedFileType("");
      setMonthReference("");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento del file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!fileUrl || !selectedZone || !selectedFileType || !monthReference) {
      toast.error("Compila tutti i campi richiesti");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Call edge function to download from URL
      const { data, error } = await supabase.functions.invoke("dispatch-file-downloader", {
        body: {
          fileUrl,
          zoneCode: selectedZone,
          fileType: selectedFileType,
          monthReference,
        },
      });

      if (error) throw error;

      toast.success("File scaricato e caricato con successo");
      setFileUrl("");
      setSelectedZone("");
      setSelectedFileType("");
      setMonthReference("");
    } catch (error) {
      console.error("URL upload error:", error);
      toast.error("Errore durante il download del file da URL");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carica File</CardTitle>
        <CardDescription>
          Carica i file di letture, curve e anagrafiche per il processamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Zona</Label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona zona" />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((zone) => (
                  <SelectItem key={zone.code} value={zone.code}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo File</Label>
            <Select value={selectedFileType} onValueChange={setSelectedFileType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mese Riferimento</Label>
            <Input
              type="month"
              value={monthReference}
              onChange={(e) => setMonthReference(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "direct" | "url")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">
              <Upload className="w-4 h-4 mr-2" />
              Carica File
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="w-4 h-4 mr-2" />
              Da URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <Input
                type="file"
                accept=".csv,.xml,.xlsx,.zip"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="max-w-md mx-auto"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  File selezionato: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Supporto per file di grandi dimensioni</p>
                <p>Il sistema supporta file CSV, XML, XLSX e ZIP fino a 500 MB. Per file più grandi, utilizza il caricamento da URL.</p>
              </div>
            </div>

            <Button
              onClick={handleDirectUpload}
              disabled={isUploading || !selectedFile || !selectedZone || !selectedFileType || !monthReference}
              className="w-full"
            >
              {isUploading ? "Caricamento in corso..." : "Carica File"}
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>URL del File</Label>
              <Input
                type="url"
                placeholder="https://wetransfer.com/... o altro link diretto"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Caricamento da URL</p>
                <p>Supporta WeTransfer, Google Drive, Dropbox e altri servizi. Il file verrà scaricato automaticamente dal sistema.</p>
              </div>
            </div>

            <Button
              onClick={handleUrlUpload}
              disabled={isUploading || !fileUrl || !selectedZone || !selectedFileType || !monthReference}
              className="w-full"
            >
              {isUploading ? "Download in corso..." : "Scarica e Carica"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
