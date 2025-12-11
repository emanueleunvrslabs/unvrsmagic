import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Send } from "lucide-react";
import "@/components/labs/SocialMediaCard.css";

interface SendEmailModalProps {
  recipientEmail: string;
  recipientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendEmailModal({ recipientEmail, recipientName, open, onOpenChange }: SendEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!subject.trim() || !text.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }

    setLoading(true);

    try {
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
          attachmentUrls: uploadedAttachments
        }
      });

      if (error) throw error;

      toast.success("Email sent successfully");
      onOpenChange(false);
      
      // Reset form
      setSubject("");
      setText("");
      setAttachments([]);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-2xl">
        <div className="labs-client-card rounded-[22px] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10">
              <Send className="w-5 h-5 text-white/80" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-white">Send Email</div>
              <div className="text-sm text-white/50">{recipientEmail}</div>
            </div>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject" className="text-white/80 text-sm mb-2 block">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  disabled={loading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-white/80 text-sm mb-2 block">
                  Message
                </Label>
                <Textarea
                  id="message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Email message"
                  rows={8}
                  disabled={loading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div>
                <Label htmlFor="file-upload" className="text-white/80 text-sm mb-2 block">
                  Attachments
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={loading}
                  className="text-white"
                >
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </label>
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-sm border border-white/10 text-white"
                      >
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent text-white/60 hover:text-white"
                          onClick={() => removeAttachment(index)}
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Send Button Area */}
          <div className="p-6 border-t border-white/10 flex justify-end">
            <Button
              onClick={handleSend}
              disabled={loading}
              size="lg"
              className="text-white"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
