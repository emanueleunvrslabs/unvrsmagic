import { Sparkles, Bot, Palette, Code } from "lucide-react";

const services = [
  {
    icon: Bot,
    title: "AI & Machine Learning",
    description: "Soluzioni di intelligenza artificiale personalizzate per automatizzare e ottimizzare i tuoi processi aziendali"
  },
  {
    icon: Sparkles,
    title: "Automazione Intelligente",
    description: "Sistemi automatizzati che lavorano 24/7 per aumentare l'efficienza e ridurre i costi operativi"
  },
  {
    icon: Palette,
    title: "Design & UX",
    description: "Interfacce intuitive e moderne che offrono un'esperienza utente eccezionale"
  },
  {
    icon: Code,
    title: "Sviluppo Software",
    description: "Applicazioni web e mobile scalabili costruite con le tecnologie più avanzate"
  }
];

export function LandingServices() {
  return (
    <section id="services" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            I Nostri Servizi
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Offriamo soluzioni complete per trasformare la tua visione in realtà
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl border border-border/40 backdrop-blur-xl bg-card/30 hover:bg-card/50 transition-all duration-300 hover:scale-105"
            >
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
