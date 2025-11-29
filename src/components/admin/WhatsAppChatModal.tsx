import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import "@/components/labs/SocialMediaCard.css";

interface WhatsAppChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactPhone: string;
  clientId: string;
  contactId: string;
}

interface Message {
  id: string;
  message_text: string;
  direction: "incoming" | "outgoing";
  status: string;
  created_at: string;
}

export function WhatsAppChatModal({
  open,
  onOpenChange,
  contactName,
  contactPhone,
  clientId,
  contactId,
}: WhatsAppChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load existing messages
  useEffect(() => {
    if (open) {
      loadMessages();
    }
  }, [open, clientId, contactId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel("whatsapp-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_messages",
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          console.log("Realtime message:", payload);
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as Message]);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, contactId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("client_id", clientId)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages((data || []) as Message[]);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          phoneNumber: contactPhone,
          message: newMessage,
          clientId,
          contactId,
        },
      });

      if (error) throw error;

      setNewMessage("");
      
      toast({
        title: "Message sent",
        description: "WhatsApp message sent successfully",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none">
        <div className="whatsapp-chat-modal">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <DialogHeader className="mb-4">
            <DialogTitle className="text-white">WhatsApp Chat - {contactName}</DialogTitle>
            <p className="text-sm text-muted-foreground">{contactPhone}</p>
          </DialogHeader>

          <ScrollArea ref={scrollRef} className="flex-1 pr-4 max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.direction === "outgoing" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.direction === "outgoing"
                          ? "bg-primary/30 text-primary-foreground"
                          : "bg-muted/30"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.message_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs opacity-70">
                          {format(new Date(message.created_at), "HH:mm")}
                        </span>
                        {message.direction === "outgoing" && (
                          <span className="text-xs opacity-70">
                            {message.status === "sent" && "✓"}
                            {message.status === "delivered" && "✓✓"}
                            {message.status === "read" && "✓✓"}
                            {message.status === "failed" && "✗"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t border-white/10">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="resize-none bg-white/5 border-white/10"
              rows={3}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="h-auto"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
