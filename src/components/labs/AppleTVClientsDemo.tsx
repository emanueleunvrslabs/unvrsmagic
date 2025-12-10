import { useState, useCallback, useEffect } from "react";
import { File, CheckSquare, Kanban, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import "./SocialMediaCard.css";

interface MockClient {
  id: string;
  company_name: string;
  city: string;
  color: string;
}

const mockClients: MockClient[] = [
  { id: "1", company_name: "Acme Corporation", city: "Milano", color: "from-purple-600 to-blue-600" },
  { id: "2", company_name: "Tech Solutions", city: "Roma", color: "from-pink-600 to-rose-600" },
  { id: "3", company_name: "Global Industries", city: "Torino", color: "from-cyan-600 to-teal-600" },
  { id: "4", company_name: "Future Systems", city: "Napoli", color: "from-orange-600 to-amber-600" },
  { id: "5", company_name: "Digital Ventures", city: "Firenze", color: "from-green-600 to-emerald-600" },
  { id: "6", company_name: "Smart Services", city: "Bologna", color: "from-indigo-600 to-violet-600" },
  { id: "7", company_name: "Innovation Hub", city: "Venezia", color: "from-red-600 to-pink-600" },
  { id: "8", company_name: "Cloud Partners", city: "Genova", color: "from-blue-600 to-cyan-600" },
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

  const selectedClient = mockClients[selectedIndex];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-4">
        <h1 className="text-3xl font-semibold text-white/90 tracking-tight">Clients</h1>
      </div>

      {/* Carousel Gallery */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {mockClients.map((client, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={client.id}
                  className="flex-[0_0_45%] min-w-0 px-3"
                >
                  <div
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                      "relative aspect-[16/9] rounded-3xl overflow-hidden cursor-pointer",
                      "transition-all duration-500 ease-out",
                      isSelected
                        ? "scale-100 opacity-100"
                        : "scale-90 opacity-40 hover:opacity-60"
                    )}
                  >
                    {/* Gradient Background */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      client.color
                    )} />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                      <div className="flex items-end justify-between">
                        <div>
                          <h2 className="text-4xl font-bold text-white tracking-tight">
                            {client.company_name}
                          </h2>
                          <p className="text-white/70 text-lg mt-1">{client.city}</p>
                        </div>
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">
                            {client.company_name[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Glow effect for selected */}
                    {isSelected && (
                      <div className="absolute inset-0 ring-2 ring-white/30 rounded-3xl shadow-[0_0_60px_rgba(255,255,255,0.2)]" />
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
      <div className="px-8 pb-8">
        <div className="grid grid-cols-5 gap-4">
          {actionItems.map((action, index) => {
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
