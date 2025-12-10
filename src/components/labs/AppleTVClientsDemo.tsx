import { useState, useCallback, useEffect } from "react";
import { File, CheckSquare, Kanban, Mail, MessageCircle, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import "./SocialMediaCard.css";

interface MockClient {
  id: string;
  company_name: string;
  city: string;
}

const mockClients: MockClient[] = [
  { id: "1", company_name: "Acme Corporation", city: "Milano" },
  { id: "2", company_name: "Tech Solutions", city: "Roma" },
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("clients");
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="h-full flex flex-col">
      {/* Top Menu Bar */}
      <div className="flex justify-center pt-6 pb-4">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/15">
          <button
            onClick={() => setActiveTab("new")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTab === "new"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white/80"
            )}
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTab === "clients"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white/80"
            )}
          >
            Clients
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={cn(
              "p-2 rounded-full transition-all",
              activeTab === "search"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white/80"
            )}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Gallery */}
      <div className="flex-1 flex flex-col justify-center max-h-[55%]">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {mockClients.map((client, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={client.id}
                  className="flex-[0_0_50%] min-w-0 px-4"
                >
                  <div
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                      "labs-client-card relative aspect-[16/9] rounded-[20px] overflow-hidden cursor-pointer",
                      "transition-all duration-500 ease-out",
                      isSelected
                        ? "scale-100 opacity-100"
                        : "scale-90 opacity-40 hover:opacity-60"
                    )}
                  >
                    {/* Stars Layer */}
                    <div className="labs-stars-layer" />
                    <div className="labs-stars-layer-2" />
                    <div className="labs-stars-layer-3" />
                    
                    {/* Shooting Stars */}
                    <div className="labs-shooting-star labs-shooting-star-1" />
                    <div className="labs-shooting-star labs-shooting-star-2" />
                    <div className="labs-shooting-star labs-shooting-star-3" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-between p-8 z-10">
                      <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                          {client.company_name}
                        </h2>
                        <p className="text-white/60 text-lg mt-2">{client.city}</p>
                      </div>
                      <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <span className="text-4xl font-bold text-white/80">
                          {client.company_name[0]}
                        </span>
                      </div>
                    </div>

                    {/* Selected Glow */}
                    {isSelected && (
                      <div className="absolute inset-0 ring-1 ring-white/20 rounded-[20px] shadow-[0_0_60px_rgba(155,64,252,0.3)]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {mockClients.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === selectedIndex
                  ? "bg-white w-6"
                  : "bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Action Cards */}
      <div className="px-8 py-10">
        <div className="grid grid-cols-5 gap-4">
          {actionItems.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className={cn(
                  "p-5 rounded-2xl transition-all duration-300",
                  "bg-white/5 backdrop-blur-xl border border-white/10",
                  "hover:border-white/30 hover:bg-white/10 hover:scale-105",
                  "flex flex-col items-center gap-3"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white/70" strokeWidth={1.5} />
                </div>
                <span className="text-white/70 text-sm font-medium">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
