import { useState, useRef, useEffect } from "react";
import { Mail, Send, Inbox, Loader2, X, Plus, Trash2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import type { ClientEmail } from "@/types/client";

interface ClientEmailSectionProps {
  clientId: string;
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
  onClose: () => void;
}

type TabType = "inbox" | "sent" | "compose";

export function ClientEmailSection({ clientId, contacts, onClose }: ClientEmailSectionProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<ClientEmail | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get first contact email automatically
  const primaryContact = contacts[0];
  const recipientEmail = primaryContact?.email || "";
  const recipientName = primaryContact ? `${primaryContact.first_name} ${primaryContact.last_name}` : "";
  
  // Compose form state
  const [composeData, setComposeData] = useState({
    subject: "",
    body: ""
  });

  // Fetch emails
  const { data: emails, isLoading } = useQuery({
    queryKey: ["client-emails", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_emails")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Real-time subscription for new emails
  useEffect(() => {
    const channel = supabase
      .channel(`client-emails-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_emails',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Email realtime update:', payload);
          // Invalidate query to refetch emails
          queryClient.invalidateQueries({ queryKey: ["client-emails", clientId] });
          
          // Show toast for new received emails
          if (payload.eventType === 'INSERT' && payload.new.direction === 'received') {
            toast.info(`New email from ${payload.new.sender_email}`, {
              description: payload.new.subject
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, queryClient]);

  const inboxEmails = emails?.filter(e => e.direction === "received") || [];
  const sentEmails = emails?.filter(e => e.direction === "sent") || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error("This client has no contacts with email");
      return;
    }
    if (!composeData.subject || !composeData.body) {
      toast.error("Please fill in subject and message");
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Upload attachments
      const uploadedAttachments: string[] = [];
      for (const file of attachments) {
        const filePath = `email-attachments/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("email-attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Use signed URL with 1 hour expiration for email delivery
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("email-attachments")
          .createSignedUrl(filePath, 3600);

        if (signedUrlError) throw signedUrlError;
        if (signedUrlData?.signedUrl) {
          uploadedAttachments.push(signedUrlData.signedUrl);
        }
      }

      // Send email via edge function
      const { error: sendError } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail,
          recipientName,
          subject: composeData.subject,
          text: composeData.body,
          attachmentUrls: uploadedAttachments
        }
      });

      if (sendError) throw sendError;

      // Save to database
      const { error: dbError } = await supabase
        .from("client_emails")
        .insert({
          client_id: clientId,
          contact_id: primaryContact?.id || null,
          user_id: user.id,
          direction: "sent",
          subject: composeData.subject,
          body: composeData.body,
          recipient_email: recipientEmail,
          sender_email: "emanuele@unvrslabs.dev",
          status: "sent",
          attachments: uploadedAttachments
        });

      if (dbError) throw dbError;

      toast.success("Email sent successfully");
      setComposeData({ subject: "", body: "" });
      setAttachments([]);
      setActiveTab("sent");
      queryClient.invalidateQueries({ queryKey: ["client-emails", clientId] });
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from("client_emails")
        .delete()
        .eq("id", emailId);
      
      if (error) throw error;
      
      toast.success("Email deleted");
      setSelectedEmail(null);
      queryClient.invalidateQueries({ queryKey: ["client-emails", clientId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete email");
    }
  };

  const renderEmailList = (emailList: ClientEmail[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-white/50" />
        </div>
      );
    }

    if (emailList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-white/40">
          <Mail className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">No emails yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {emailList.map((email) => (
          <div
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className={cn(
              "p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer transition-all",
              "hover:bg-white/10",
              selectedEmail?.id === email.id && "bg-white/10 border-white/20"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/90 text-sm font-medium truncate">
                    {email.direction === "sent" ? email.recipient_email : email.sender_email}
                  </span>
                  {!email.read_at && email.direction === "received" && (
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  )}
                </div>
                <p className="text-white/70 text-sm font-medium truncate">{email.subject}</p>
                <p className="text-white/40 text-xs truncate mt-1">{email.body.substring(0, 80)}...</p>
              </div>
              <div className="text-white/40 text-xs whitespace-nowrap">
                {format(new Date(email.created_at), "dd/MM/yy")}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="labs-client-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Email</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 border border-white/20 text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab("inbox"); setSelectedEmail(null); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            activeTab === "inbox"
              ? "bg-white/15 text-white border border-white/20"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          )}
        >
          <Inbox className="w-4 h-4" />
          Inbox
          {inboxEmails.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {inboxEmails.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("sent"); setSelectedEmail(null); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            activeTab === "sent"
              ? "bg-white/15 text-white border border-white/20"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          )}
        >
          <Send className="w-4 h-4" />
          Sent
          {sentEmails.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {sentEmails.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("compose"); setSelectedEmail(null); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            activeTab === "compose"
              ? "bg-white/15 text-white border border-white/20"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          )}
        >
          <Plus className="w-4 h-4" />
          Compose
        </button>
      </div>

      {/* Content */}
      {activeTab === "compose" ? (
        <div className="space-y-4">
          {/* Recipient (auto-filled) */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-white/50 text-sm">To:</span>
              <span className="text-white text-sm font-medium">
                {recipientName} ({recipientEmail})
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-white/70 text-sm">Subject</label>
            <Input
              value={composeData.subject}
              onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              placeholder="Email subject"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-white/70 text-sm">Message</label>
            <Textarea
              value={composeData.body}
              onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
              placeholder="Write your message..."
              rows={6}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl resize-none"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm"
              >
                <Paperclip className="w-4 h-4" />
                Attach Files
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm border border-white/10 text-white"
                  >
                    <Paperclip className="w-4 h-4 text-white/60" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSendEmail}
              disabled={isSending || !recipientEmail}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/15 transition-all disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Email
            </button>
          </div>
        </div>
      ) : selectedEmail ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedEmail(null)}
              className="text-white/60 hover:text-white text-sm"
            >
              ← Back to list
            </button>
            <button
              onClick={() => handleDeleteEmail(selectedEmail.id)}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/90 font-medium">{selectedEmail.subject}</p>
                <p className="text-white/50 text-sm mt-1">
                  {selectedEmail.direction === "sent" ? "To: " : "From: "}
                  {selectedEmail.direction === "sent" ? selectedEmail.recipient_email : selectedEmail.sender_email}
                </p>
              </div>
              <span className="text-white/40 text-xs">
                {format(new Date(selectedEmail.created_at), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            <div className="text-white/80 text-sm whitespace-pre-wrap">
              {selectedEmail.body}
            </div>
            
            {/* Show attachments if any */}
            {selectedEmail.attachments && Array.isArray(selectedEmail.attachments) && (selectedEmail.attachments as string[]).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/50 text-xs mb-2">Attachments:</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedEmail.attachments as string[]).map((url: string, index: number) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm border border-white/10 text-white hover:bg-white/15"
                    >
                      <Paperclip className="w-4 h-4" />
                      Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        renderEmailList(activeTab === "inbox" ? inboxEmails : sentEmails)
      )}
    </div>
  );
}