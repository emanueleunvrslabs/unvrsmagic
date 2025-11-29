import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Image, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SendEmailModalProps {
  recipientEmail: string;
  recipientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GalleryItem {
  id: string;
  title: string;
  media_url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
}

export function SendEmailModal({ recipientEmail, recipientName, open, onOpenChange }: SendEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedGalleryItems, setSelectedGalleryItems] = useState<string[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  useEffect(() => {
    if (open) {
      loadGalleryItems();
    }
  }, [open]);

  const loadGalleryItems = async () => {
    setLoadingGallery(true);
    try {
      // Load from ai_social_content
      const { data: socialContent, error: socialError } = await supabase
        .from("ai_social_content")
        .select("id, title, media_url, type, thumbnail_url")
        .eq("status", "completed")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (socialError) throw socialError;

      // Load from ai_art_content
      const { data: artContent, error: artError } = await supabase
        .from("ai_art_content")
        .select("id, title, media_url, type, thumbnail_url")
        .eq("status", "completed")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (artError) throw artError;

      const combined: GalleryItem[] = [
        ...(socialContent || []).map(item => ({
          id: item.id,
          title: item.title,
          media_url: item.media_url!,
          type: item.type as 'image' | 'video',
          thumbnail_url: item.thumbnail_url || undefined
        })),
        ...(artContent || []).map(item => ({
          id: item.id,
          title: item.title,
          media_url: item.media_url!,
          type: item.type as 'image' | 'video',
          thumbnail_url: item.thumbnail_url || undefined
        }))
      ];

      setGalleryItems(combined);
    } catch (error: any) {
      console.error("Error loading gallery:", error);
      toast.error("Failed to load gallery items");
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const toggleGalleryItem = (id: string) => {
    setSelectedGalleryItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!subject.trim() || !text.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }

    setLoading(true);

    try {
      // Prepare gallery URLs
      const galleryUrls = galleryItems
        .filter(item => selectedGalleryItems.includes(item.id))
        .map(item => item.media_url);

      // Upload file attachments to Supabase Storage
      const uploadedAttachments: string[] = [];
      for (const file of attachments) {
        const filePath = `email-attachments/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("email-attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("email-attachments")
          .getPublicUrl(filePath);

        uploadedAttachments.push(publicUrl);
      }

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail,
          recipientName,
          subject,
          text,
          attachmentUrls: [...uploadedAttachments, ...galleryUrls]
        }
      });

      if (error) throw error;

      toast.success("Email sent successfully");
      onOpenChange(false);
      
      // Reset form
      setSubject("");
      setText("");
      setAttachments([]);
      setSelectedGalleryItems([]);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Email to {recipientName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                disabled={loading}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Email message"
                rows={6}
                disabled={loading}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <Tabs defaultValue="files" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="files">File Attachments</TabsTrigger>
              <TabsTrigger value="gallery">Gallery Media</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">
                    <Button type="button" variant="outline" asChild disabled={loading}>
                      <span className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </div>

                {attachments.length > 0 && (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="flex-1 overflow-hidden">
              {loadingGallery ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-3 gap-2">
                    {galleryItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleGalleryItem(item.id)}
                        disabled={loading}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedGalleryItems.includes(item.id)
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                      >
                        {item.type === 'image' ? (
                          <img
                            src={item.media_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <video
                              src={item.media_url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <Video className="absolute top-2 right-2 h-4 w-4 text-white" />
                          </div>
                        )}
                        {selectedGalleryItems.includes(item.id) && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-primary-foreground text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
