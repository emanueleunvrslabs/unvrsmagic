import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Image as ImageIcon, Loader2 } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  media_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

interface ImageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string) => void;
}

export function ImageSelector({ open, onOpenChange, onSelect }: ImageSelectorProps) {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      loadImages();
    }
  }, [open]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ai_social_content")
        .select("id, title, media_url, thumbnail_url, created_at")
        .eq("user_id", user.id)
        .eq("type", "image")
        .eq("status", "completed")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error loading images:", error);
      toast.error("Failed to load images from gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!url) {
      toast.error("Please enter a valid URL");
      return;
    }
    onSelect(url);
    onOpenChange(false);
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const base64Data = reader.result as string;
      onSelect(base64Data);
      onOpenChange(false);
      toast.success("Image loaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to load image file");
    } finally {
      setUploading(false);
    }
  };

  const handleGallerySelect = (imageUrl: string) => {
    onSelect(imageUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="gallery" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">
              <ImageIcon className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="flex-1 overflow-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                <p>No images in gallery</p>
                <p className="text-sm mt-2">Generate some images first</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleGallerySelect(image.media_url!)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors group"
                  >
                    <img
                      src={image.thumbnail_url || image.media_url!}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Select</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Choose Image File</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 720p or higher, 16:9 or 9:16 aspect ratio
              </p>
            </div>
            {file && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
              </div>
            )}
            <Button
              onClick={handleFileUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Use This Image"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Image URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Image should be 720p or higher in 16:9 or 9:16 aspect ratio
              </p>
            </div>
            {url && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img
                  src={url}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    toast.error("Failed to load image from URL");
                  }}
                />
              </div>
            )}
            <Button
              onClick={handleUrlSubmit}
              disabled={!url}
              className="w-full"
            >
              Use This URL
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
