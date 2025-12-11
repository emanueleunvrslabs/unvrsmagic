import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface ClientContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp_number: string;
}

interface ClientWhatsAppSectionProps {
  clientId: string;
  contacts: ClientContact[];
  onClose: () => void;
}

interface Message {
  id: string;
  message_text: string;
  direction: "incoming" | "outgoing";
  status: string;
  created_at: string;
  contact_id: string;
}

export function ClientWhatsAppSection({ clientId, contacts, onClose }: ClientWhatsAppSectionProps) {
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(contacts[0] || null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages for selected contact
  const { data: messages, isLoading } = useQuery({
    queryKey: ["whatsapp-messages", clientId, selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return [];
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("client_id", clientId)
        .eq("contact_id", selectedContact.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!selectedContact,
  });

  // Real-time subscription
  useEffect(() => {
    if (!selectedContact) return;

    const channel = supabase
      .channel(`whatsapp-${clientId}-${selectedContact.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `contact_id=eq.${selectedContact.id}`
        },
        (payload) => {
          console.log('WhatsApp realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", clientId, selectedContact.id] });
          
          if (payload.eventType === 'INSERT' && (payload.new as Message).direction === 'incoming') {
            toast.info(`New WhatsApp from ${selectedContact.first_name}`, {
              description: (payload.new as Message).message_text.substring(0, 50)
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, selectedContact, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !selectedContact) return;

    try {
      setSending(true);

      const { error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          phoneNumber: selectedContact.whatsapp_number,
          message: newMessage,
          clientId,
          contactId: selectedContact.id,
        },
      });

      if (error) throw error;

      setNewMessage("");
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-card-large">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30">
            <MessageCircle className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">WhatsApp</h3>
            <p className="text-xs text-white/60">
              {selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name} - ${selectedContact.whatsapp_number}` : "Select a contact"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Contact selector if multiple contacts */}
      {contacts.length > 1 && (
        <div className="p-3 border-b border-white/10 flex gap-2 overflow-x-auto">
          {contacts.filter(c => c.whatsapp_number).map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                selectedContact?.id === contact.id
                  ? "bg-green-500/30 text-green-300 border border-green-500/50"
                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
              )}
            >
              {contact.first_name} {contact.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
          </div>
        ) : !selectedContact ? (
          <div className="flex items-center justify-center h-full text-white/60">
            No contact with WhatsApp number
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/60">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-3">
            {messages?.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.direction === "outgoing" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.direction === "outgoing"
                      ? "bg-green-500/20 text-white border border-green-500/30"
                      : "bg-white/10 text-white border border-white/10"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.message_text}</p>
                  <p className="text-xs opacity-60 mt-1 flex items-center gap-1">
                    {format(new Date(message.created_at), "HH:mm")}
                    {message.direction === "outgoing" && (
                      <span>
                        {message.status === "sent" && "✓"}
                        {message.status === "delivered" && "✓✓"}
                        {message.status === "read" && "✓✓"}
                        {message.status === "failed" && "✗"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      {selectedContact && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-end gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/50 resize-none min-h-[40px]"
              rows={1}
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="shrink-0 bg-green-500/30 hover:bg-green-500/40 text-white border border-green-500/30"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}