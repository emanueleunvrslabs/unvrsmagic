import { useState } from "react";
import { Mail, Send, Inbox, Loader2, X, Plus, Trash2, Paperclip, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

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
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Compose form state
  const [composeData, setComposeData] = useState({
    recipientEmail: "",
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

  const inboxEmails = emails?.filter(e => e.direction === "received") || [];
  const sentEmails = emails?.filter(e => e.direction === "sent") || [];

  const handleSendEmail = async () => {
    if (!composeData.recipientEmail || !composeData.subject || !composeData.body) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Find contact by email
      const contact = contacts.find(c => c.email === composeData.recipientEmail);

      // Send email via edge function
      const { error: sendError } = await supabase.functions.invoke("send-email", {
        body: {
          to: composeData.recipientEmail,
          recipientName: contact ? `${contact.first_name} ${contact.last_name}` : composeData.recipientEmail,
          subject: composeData.subject,
          text: composeData.body,
          attachmentUrls: []
        }
      });

      if (sendError) throw sendError;

      // Save to database
      const { error: dbError } = await supabase
        .from("client_emails")
        .insert({
          client_id: clientId,
          contact_id: contact?.id || null,
          user_id: user.id,
          direction: "sent",
          subject: composeData.subject,
          body: composeData.body,
          recipient_email: composeData.recipientEmail,
          sender_email: "emanuele@unvrslabs.dev",
          status: "sent"
        });

      if (dbError) throw dbError;

      toast.success("Email sent successfully");
      setComposeData({ recipientEmail: "", subject: "", body: "" });
      setActiveTab("sent");
      queryClient.invalidateQueries({ queryKey: ["client-emails", clientId] });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
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
    } catch (error: any) {
      toast.error(error.message || "Failed to delete email");
    }
  };

  const renderEmailList = (emailList: any[]) => {
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
          <div className="space-y-2">
            <label className="text-white/70 text-sm">To</label>
            <select
              value={composeData.recipientEmail}
              onChange={(e) => setComposeData({ ...composeData, recipientEmail: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="" className="bg-zinc-900">Select contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.email} className="bg-zinc-900">
                  {contact.first_name} {contact.last_name} ({contact.email})
                </option>
              ))}
            </select>
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
              rows={8}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl resize-none"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSendEmail}
              disabled={isSending}
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
          </div>
        </div>
      ) : (
        renderEmailList(activeTab === "inbox" ? inboxEmails : sentEmails)
      )}
    </div>
  );
}