import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Inbox, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
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
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(
    contacts.find(c => c.whatsapp_number) || null
  );
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contactsWithWhatsApp = contacts.filter(c => c.whatsapp_number);

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
            toast.info(`New message from ${selectedContact.first_name}`, {
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
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", clientId, selectedContact.id] });
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

  const incomingMessages = messages?.filter(m => m.direction === "incoming") || [];
  const outgoingMessages = messages?.filter(m => m.direction === "outgoing") || [];

  return (
    <div className="labs-client-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">WhatsApp</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 border border-white/20 text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contact selector */}
      {contactsWithWhatsApp.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {contactsWithWhatsApp.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                selectedContact?.id === contact.id
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
              )}
            >
              <MessageCircle className="w-4 h-4" />
              {contact.first_name} {contact.last_name}
            </button>
          ))}
        </div>
      )}

      {/* No contacts message */}
      {contactsWithWhatsApp.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-white/40">
          <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">No contacts with WhatsApp number</p>
        </div>
      ) : (
        <>
          {/* Current contact info */}
          {selectedContact && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <span className="text-white text-sm font-medium">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </span>
                  <p className="text-white/50 text-xs">{selectedContact.whatsapp_number}</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="space-y-3 max-h-[350px] overflow-y-auto mb-4 pr-2"
          >
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages?.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.direction === "outgoing" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-4 rounded-xl border",
                      message.direction === "outgoing"
                        ? "bg-green-500/15 border-green-500/30 text-white"
                        : "bg-white/5 border-white/10 text-white"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-white/40 text-xs">
                        {format(new Date(message.created_at), "dd/MM/yy HH:mm")}
                      </span>
                      {message.direction === "outgoing" && (
                        <span className="text-white/40 text-xs">
                          {message.status === "sent" && "✓"}
                          {message.status === "delivered" && "✓✓"}
                          {message.status === "read" && "✓✓"}
                          {message.status === "failed" && "✗"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          {selectedContact && (
            <div className="flex items-end gap-3">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl resize-none min-h-[48px]"
                rows={1}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-300 hover:bg-green-500/30 transition-all disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}