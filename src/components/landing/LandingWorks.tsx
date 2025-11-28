export function LandingWorks() {
  const works = [
    {
      title: "AI Social Platform",
      category: "Social Media Automation",
      description: "Piattaforma completa per la generazione e pubblicazione automatica di contenuti sui social media"
    },
    {
      title: "Trading Intelligence",
      category: "Financial AI",
      description: "Sistema di analisi avanzata per il trading algoritmico e l'ottimizzazione del portfolio"
    },
    {
      title: "Process Automation",
      category: "Business Automation",
      description: "Automazione intelligente di processi aziendali complessi con AI multi-agente"
    }
  ];

  return (
    <section id="works" className="py-24 bg-accent/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            I Nostri Progetti
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Scopri alcune delle soluzioni che abbiamo realizzato
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {works.map((work, index) => (
            <div
              key={index}
              className="group cursor-pointer"
            >
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 overflow-hidden border border-border/40">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-primary/20">0{index + 1}</span>
                </div>
              </div>
              
              <span className="text-sm text-primary mb-2 block">{work.category}</span>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                {work.title}
              </h3>
              <p className="text-muted-foreground">{work.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
