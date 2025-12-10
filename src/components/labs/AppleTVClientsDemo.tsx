import { useState, useRef } from "react";
import { File, CheckSquare, Kanban, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import "./SocialMediaCard.css";

interface MockClient {
  id: string;
  company_name: string;
  city: string;
}

const mockClients: MockClient[] = [
  { id: "1", company_name: "Acme Corporation", city: "Milano" },
  { id: "2", company_name: "Tech Solutions Ltd", city: "Roma" },
  { id: "3", company_name: "Global Industries", city: "Torino" },
  { id: "4", company_name: "Future Systems", city: "Napoli" },
  { id: "5", company_name: "Digital Ventures", city: "Firenze" },
  { id: "6", company_name: "Smart Services", city: "Bologna" },
  { id: "7", company_name: "Innovation Hub", city: "Venezia" },
  { id: "8", company_name: "Cloud Partners", city: "Genova" },
];

const actionItems = [
  { id: "documents", label: "Documents", icon: File },
  { id: "notes", label: "Notes", icon: CheckSquare },
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export function AppleTVClientsDemo() {
  const [selectedClient, setSelectedClient] = useState<MockClient | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="px-2">
        <h1 className="text-2xl font-semibold text-white/90">Labs - Apple TV Style</h1>
        <p className="text-white/50 text-sm mt-1">Seleziona un cliente dalla gallery</p>
      </div>

      {/* Client Gallery - Horizontal Scroll */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mockClients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={cn(
                "flex-shrink-0 w-48 p-4 rounded-2xl transition-all duration-300 text-left",
                "bg-white/5 backdrop-blur-xl border",
                selectedClient?.id === client.id
                  ? "border-white/40 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                  : "border-white/10 hover:border-white/20 hover:bg-white/10"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center mb-3">
                <span className="text-xl font-semibold text-white/80">
                  {client.company_name[0]}
                </span>
              </div>
              <h3 className="text-white/90 font-medium text-sm truncate">
                {client.company_name}
              </h3>
              <p className="text-white/40 text-xs mt-0.5">{client.city}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Action Cards - Appear when client selected */}
      <div 
        className={cn(
          "transition-all duration-500 ease-out",
          selectedClient 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {selectedClient && (
          <div className="px-2">
            <h2 className="text-lg font-medium text-white/70 mb-4">
              Azioni per <span className="text-white/90">{selectedClient.company_name}</span>
            </h2>
            
            <div className="grid grid-cols-5 gap-4">
              {actionItems.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    className={cn(
                      "p-6 rounded-2xl transition-all duration-300",
                      "bg-white/5 backdrop-blur-xl border border-white/10",
                      "hover:border-white/30 hover:bg-white/10 hover:scale-105",
                      "flex flex-col items-center gap-3",
                      "animate-fade-in"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white/70" strokeWidth={1.5} />
                    </div>
                    <span className="text-white/70 text-sm font-medium">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
