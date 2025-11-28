import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { Upload, File, X, CheckCircle2, AlertCircle, FileArchive, FolderOpen, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

interface UploadedFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

interface SavedFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  is_extracted: boolean;
  parent_zip_id: string | null;
  created_at: string;
}

const FileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved files from database
  useEffect(() => {
    loadSavedFiles();
  }, []);

  const loadSavedFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      await loadSavedFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = async (newFiles: File[]) => {
    const filesToAdd: UploadedFile[] = [];
    
    for (const file of newFiles) {
      // Check if it's a ZIP file
      const isZip = file.name.toLowerCase().endsWith('.zip') || 
                    file.type === 'application/zip' ||
                    file.type === 'application/x-zip-compressed';
      
      if (isZip) {
        try {
          // Extract ZIP contents
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);
          
          // Add original ZIP
          filesToAdd.push({
            file,
            progress: 0,
            status: "pending" as const,
          });
          
          // Extract each file
          for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir) {
              const content = await zipEntry.async('blob');
              const fileName = relativePath.split('/').pop() || relativePath;
              
              // Create File from Blob
              const extractedFile = new window.File([content], fileName, {
                type: 'application/octet-stream'
              });
              
              filesToAdd.push({
                file: extractedFile,
                progress: 0,
                status: "pending" as const,
              });
            }
          }
          
          toast.success(`ZIP extracted: ${Object.keys(zip.files).length} files found`);
        } catch (error) {
          console.error('Error extracting ZIP:', error);
          toast.error('Failed to extract ZIP file');
          // Add ZIP as regular file if extraction fails
          filesToAdd.push({
            file,
            progress: 0,
            status: "pending" as const,
          });
        }
      } else {
        // Regular file
        filesToAdd.push({
          file,
          progress: 0,
          status: "pending" as const,
        });
      }
    }
    
    setFiles((prev) => [...prev, ...filesToAdd]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const uploadFile = async (fileData: UploadedFile, index: number) => {
    const { file } = fileData;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "uploading" as const } : f))
    );

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call edge function to upload file (and extract if ZIP)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-file`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload result:', result);

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { 
                ...f, 
                status: "completed" as const, 
                progress: 100,
              }
            : f
        )
      );

      toast.success(result.message || `${file.name} uploaded successfully`);
      
      // Reload saved files to show newly uploaded files
      await loadSavedFiles();
    } catch (error: any) {
      console.error("Upload error:", error);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "error" as const, error: error.message }
            : f
        )
      );
      toast.error(`Failed to upload ${file.name}: ${error.message}`);
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.status === "pending");

    for (const { file, index } of pendingFiles) {
      await uploadFile(file, index);
    }
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "uploading":
        return <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">File Upload</h1>
          <p className="text-muted-foreground">Upload large files including zip archives</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Drag and drop files or click to browse. Supports all file types including zip archives.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border",
                "hover:border-primary hover:bg-primary/5 cursor-pointer"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                All file types supported • No size limit
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{files.length} file(s) selected</p>
                  <Button
                    onClick={uploadAllFiles}
                    disabled={files.every((f) => f.status !== "pending")}
                  >
                    Upload All
                  </Button>
                </div>

                <div className="space-y-2">
                  {files.map((fileData, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      {getStatusIcon(fileData.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileData.file.size)}
                          {fileData.error && ` • ${fileData.error}`}
                        </p>
                      </div>
                      {fileData.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {fileData.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => uploadFile(fileData, index)}
                        >
                          Upload
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Files Section */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              View and manage your uploaded files. ZIP files show extracted contents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading files...</div>
            ) : savedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No files uploaded yet</div>
            ) : (
              <div className="space-y-2">
                {savedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border bg-card",
                      file.parent_zip_id && "ml-8 border-l-2 border-primary/30"
                    )}
                  >
                    {file.is_extracted ? (
                      <FileArchive className="h-5 w-5 text-primary" />
                    ) : file.parent_zip_id ? (
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <File className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)}
                        {file.is_extracted && " • ZIP Archive (Extracted)"}
                        {file.parent_zip_id && " • Extracted from ZIP"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFile(file.id, file.file_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FileUpload;
