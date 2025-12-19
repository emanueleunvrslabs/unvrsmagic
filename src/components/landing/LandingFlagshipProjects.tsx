import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Zap, Brain, ScrollText, Bot, BarChart3, Shield, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useIsMobile } from "@/hooks/use-mobile";
interface ProjectFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ProjectImage {
  src: string;
  alt: string;
}

interface FlagshipProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  status: string;
  year: string;
  features: ProjectFeature[];
  gallery: ProjectImage[];
  technologies: string[];
  stats: { label: string; value: string }[];
}

// Dati del progetto Energizzo (placeholder - da sostituire con dati reali)
const projects: FlagshipProject[] = [
  {
    id: "energizzo",
    name: "Energizzo",
    tagline: "AI Energy Operating System",
    description: "Il sistema operativo intelligente che governa l'energia. Una piattaforma che unisce AI, automazione e controllo normativo.",
    heroImage: "/images/energizzo-hero.jpg",
    status: "Active",
    year: "2024",
    features: [
      {
        icon: <Zap className="w-6 h-6" />,
        title: "Dispacciamento Intelligente",
        description: "Gestione avanzata del dispacciamento energetico, con controllo dei flussi, supporto decisionale e ottimizzazione continua delle risorse in tempo reale.",
      },
      {
        icon: <Brain className="w-6 h-6" />,
        title: "Orchestrazione AI Centrale",
        description: "Max Power coordina agenti autonomi specializzati in vendite, operations, compliance, customer care e amministrazione.",
      },
      {
        icon: <ScrollText className="w-6 h-6" />,
        title: "Intelligenza Normativa Automatica",
        description: "Ricezione, analisi e adattamento automatico alle delibere e agli aggiornamenti normativi. Il sistema evolve insieme alle regole.",
      },
      {
        icon: <Bot className="w-6 h-6" />,
        title: "Operazioni Autonome",
        description: "Onboarding digitale, gestione contratti, chiamate vocali AI, customer care e flussi amministrativi completamente automatizzati.",
      },
      {
        icon: <BarChart3 className="w-6 h-6" />,
        title: "Analytics Predittive",
        description: "Modelli predittivi basati su AI per consumi, comportamenti, rischi e opportunità di mercato energetico.",
      },
      {
        icon: <Shield className="w-6 h-6" />,
        title: "Compliance Nativa",
        description: "La conformità normativa è integrata nel DNA del sistema, non come modulo esterno ma come funzione nativa.",
      },
    ],
    gallery: [
      { src: "/images/energizzo-dashboard.png", alt: "Dashboard Energizzo" },
      { src: "/images/energizzo-clienti.png", alt: "Clienti Attivi Energizzo" },
      { src: "/images/energizzo-livecall.png", alt: "AI Live Call Energizzo" },
    ],
    technologies: ["React", "Supabase", "AI Models", "IoT Integration"],
    stats: [
      { label: "Clienti Attivi", value: "50+" },
      { label: "kWh Monitorati", value: "10M+" },
      { label: "Risparmio Medio", value: "25%" },
    ],
  },
];

function ProjectCard({ project }: { project: FlagshipProject }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  // Gallery carousel state
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  
  // Features scroll state
  const featuresScrollRef = useRef<HTMLDivElement>(null);
  const [activeFeaturesIndex, setActiveFeaturesIndex] = useState(0);
  
  // Agents scroll state
  const agentsScrollRef = useRef<HTMLDivElement>(null);
  const [activeAgentsIndex, setActiveAgentsIndex] = useState(0);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();
  
  // Gallery carousel sync
  const onGallerySelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedGalleryIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    onGallerySelect();
    emblaApi.on("select", onGallerySelect);
    return () => {
      emblaApi.off("select", onGallerySelect);
    };
  }, [emblaApi, onGallerySelect]);
  
  // Features scroll handler
  const handleFeaturesScroll = useCallback(() => {
    if (!featuresScrollRef.current) return;
    const container = featuresScrollRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = 288 + 16; // w-72 (288px) + gap-4 (16px)
    const index = Math.round(scrollLeft / itemWidth);
    setActiveFeaturesIndex(Math.min(index, project.features.length - 1));
  }, [project.features.length]);
  
  // Agents scroll handler  
  const handleAgentsScroll = useCallback(() => {
    if (!agentsScrollRef.current) return;
    const container = agentsScrollRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = 256 + 16; // w-64 (256px) + gap-4 (16px)
    const index = Math.round(scrollLeft / itemWidth);
    // 10 agents total
    setActiveAgentsIndex(Math.min(index, 9));
  }, []);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8 }}
      className="w-full"
    >
      <div className="liquid-glass-card rounded-3xl overflow-hidden max-w-5xl mx-auto relative">
        {/* Italian Flag */}
        <div 
          className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full overflow-hidden"
          style={{
            backdropFilter: "blur(20px) saturate(1.3)",
            WebkitBackdropFilter: "blur(20px) saturate(1.3)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)",
          }}
        >
          <div className="flex h-full">
            <div className="w-1/3 bg-green-500/80" />
            <div className="w-1/3 bg-white/90" />
            <div className="w-1/3 bg-red-500/80" />
          </div>
        </div>
        
        {/* MODULO 1: HERO */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Hero Content */}
          <div className="p-8 md:p-12 bg-black/40 flex flex-col justify-center">
            <h4 
              className="text-lg md:text-xl font-bold text-lime-400 mb-6"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              AI Energy Operating System
            </h4>
            <div className="space-y-4 text-white/70 text-sm md:text-base leading-relaxed">
              <p>
                <span className="text-white font-semibold">Energizzo</span> è il sistema operativo intelligente che governa l'energia.
                Una piattaforma avanzata che unisce intelligenza artificiale, automazione e controllo normativo per trasformare la gestione energetica in un ecosistema autonomo, scalabile e predittivo.
              </p>
              <p>
                Dalla vendita al dispacciamento, dall'onboarding digitale alla ricezione e interpretazione automatica delle delibere, Energizzo coordina ogni flusso energetico e operativo in tempo reale.
              </p>
              <p>
                Al centro del sistema opera <span className="text-lime-400 font-semibold">Max Power</span>, il cervello centrale di Energizzo:
                un'intelligenza artificiale evoluta che osserva, decide e orchestra una rete di agenti specializzati, ognuno con un'identità, un ruolo e una funzione precisa.
              </p>
              <p className="text-white/90 italic mt-4">
                Non un software.<br />
                Un'intelligenza che governa l'energia.
              </p>
            </div>
          </div>

          {/* Hero Info */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {project.status}
              </span>
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 border border-white/20"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {project.year}
              </span>
            </div>
            
            <h3 
              className="text-4xl md:text-5xl font-bold text-white mb-2"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {project.name}
            </h3>
            <p 
              className="text-lg text-lime-300 mb-4"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {project.tagline}
            </p>
            <p className="text-white/70 mb-6 leading-relaxed">
              {project.description}
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-fit px-6 py-3 rounded-full text-sm font-medium transition-all"
              style={{
                fontFamily: "Orbitron, sans-serif",
                background: "linear-gradient(135deg, rgba(132, 204, 22, 0.4), rgba(34, 197, 94, 0.4))",
                border: "1px solid rgba(132, 204, 22, 0.5)",
              }}
            >
              Richiedi una demo
            </motion.button>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-3 text-white/60 hover:text-white transition-colors"
          >
            <span 
              className="text-sm tracking-[0.1em]"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {isExpanded ? "NASCONDI DETTAGLI" : "SCOPRI DI PIÙ"}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </button>
        </div>

        {/* Collapsible Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* MODULO 2: KEY FEATURES - Horizontal Scroll */}
              <div className="border-t border-white/10 p-8 md:p-12">
                <h4 
                  className="text-sm tracking-[0.2em] text-white/50 mb-6"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  KEY FEATURES
                </h4>
                <div 
                  ref={featuresScrollRef}
                  onScroll={handleFeaturesScroll}
                  className="overflow-x-auto pb-4 -mx-2 scrollbar-hide" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex gap-4 px-2" style={{ minWidth: "max-content" }}>
                    {project.features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-72 flex-shrink-0"
                      >
                        <div className="text-lime-400 mb-3">{feature.icon}</div>
                        <h5 
                          className="text-white font-medium mb-2 text-base"
                          style={{ fontFamily: "Orbitron, sans-serif" }}
                        >
                          {feature.title}
                        </h5>
                        <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
                {/* Mobile pagination dots for Features */}
                {isMobile && (
                  <div className="flex justify-center gap-2 mt-4">
                    {project.features.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === activeFeaturesIndex 
                            ? "bg-lime-400 w-4" 
                            : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* MODULO 3: IMAGE GALLERY */}
              <div className="border-t border-white/10 p-8 md:p-12">
                <h4 
                  className="text-sm tracking-[0.2em] text-white/50 mb-6"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  GALLERY
                </h4>
                <div className="relative">
                  <div ref={emblaRef} className="overflow-hidden rounded-xl">
                    <div className="flex">
                      {project.gallery.map((image, index) => (
                        <div
                          key={index}
                          className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-2"
                        >
                          <div 
                            className="aspect-video rounded-xl bg-gradient-to-br from-lime-500/20 to-green-500/20 overflow-hidden"
                            style={{
                              backgroundImage: `url(${image.src})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                              {image.alt}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Carousel Controls - Hidden on mobile */}
                  {!isMobile && (
                    <>
                      <button
                        onClick={scrollPrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={scrollNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
                {/* Mobile pagination dots for Gallery */}
                {isMobile && (
                  <div className="flex justify-center gap-2 mt-4">
                    {project.gallery.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === selectedGalleryIndex 
                            ? "bg-lime-400 w-4" 
                            : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* MODULO 4: AI AGENTS - Horizontal Scroll */}
              <div className="border-t border-white/10 p-8 md:p-12">
                <h4 
                  className="text-sm tracking-[0.2em] text-white/50 mb-6"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  AI AGENTS
                </h4>
                <div 
                  ref={agentsScrollRef}
                  onScroll={handleAgentsScroll}
                  className="overflow-x-auto pb-4 -mx-2 scrollbar-hide" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex gap-4 px-2" style={{ minWidth: "max-content" }}>
                    {/* Max Power - Central Agent */}
                    <div className="p-6 rounded-xl bg-lime-500/10 border border-lime-500/30 w-64 flex-shrink-0">
                      <span className="text-3xl mb-3 block">🧠</span>
                      <h5 
                        className="text-lg font-bold text-lime-400 mb-1"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        Max Power
                      </h5>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Central Intelligence Core</p>
                      <p className="text-white/70 text-sm">Il cervello che orchestra tutto.</p>
                    </div>

                    {/* Ignition */}
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-64 flex-shrink-0">
                      <span className="text-2xl mb-3 block">🚀</span>
                      <h5 
                        className="text-base font-bold text-white mb-1"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        Ignition
                      </h5>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Onboarding Agent</p>
                      <p className="text-white/60 text-sm leading-relaxed">Attiva il cliente, avvia il flusso, accende il sistema.</p>
                    </div>

                    {/* Switchboard */}
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-64 flex-shrink-0">
                      <span className="text-2xl mb-3 block">☎️</span>
                      <h5 
                        className="text-base font-bold text-white mb-1"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        Switchboard
                      </h5>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Centralino AI / Voice Agent</p>
                      <p className="text-white/60 text-sm leading-relaxed">Gestisce chiamate, instrada richieste, parla con clienti e operatori.</p>
                    </div>

                    {/* Halo */}
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-64 flex-shrink-0">
                      <span className="text-2xl mb-3 block">👤</span>
                      <h5 
                        className="text-base font-bold text-white mb-1"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        Halo
                      </h5>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Personal AI Agent (HLO)</p>
                      <p className="text-white/60 text-sm leading-relaxed">L'agente personale di ogni cliente. Conosce dati, contratti, storico.</p>
                    </div>

                    {/* Ledger */}
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-64 flex-shrink-0">
                      <span className="text-2xl mb-3 block">💳</span>
                      <h5 
                        className="text-base font-bold text-white mb-1"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        Ledger
                      </h5>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Billing & Invoicing Agent</p>
                      <p className="text-white/60 text-sm leading-relaxed">Fatture, note di credito, insoluti, riconciliazioni.</p>
                    </div>

                    {/* Gridmind */}
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-64 flex-shrink-0">
                      <span className="text-2xl mb-3 block">⚡</span>
                      <h5 
                        className="text-base font-bold text-white mb-1"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        Gridmind
                      </h5>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Dispatching Agent</p>
                      <p className="text-white/60 text-sm leading-relaxed">Intelligenza dedicata al dispacciamento energetico.</p>
                    </div>

                    {/* Oracle */}
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-64 flex-shrink-0">
                      <span className="text-2xl mb-3 block">📜</span>
                      <h5 
                        className="text-base font-bold text-white mb-1"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        Oracle
                      </h5>
                      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Regulatory & Delibere Agent</p>
                      <p className="text-white/60 text-sm leading-relaxed">Riceve, interpreta e traduce delibere e normative.</p>
                    </div>
                  </div>
                </div>
                {/* Mobile pagination dots for Agents */}
                {isMobile && (
                  <div className="flex justify-center gap-2 mt-4">
                    {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === activeAgentsIndex 
                            ? "bg-lime-400 w-4" 
                            : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* MODULO 5: TECHNOLOGIES & STATS */}
              <div className="border-t border-white/10 p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Tech Stack */}
                  <div>
                    <h4 
                      className="text-sm tracking-[0.2em] text-white/50 mb-4"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      TECH STACK
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-4 py-2 rounded-full text-xs font-medium bg-white/5 border border-white/20 text-white/70"
                          style={{ fontFamily: "Orbitron, sans-serif" }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <h4 
                      className="text-sm tracking-[0.2em] text-white/50 mb-4"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      STATS
                    </h4>
                    <div className="flex gap-8">
                      {project.stats.map((stat) => (
                        <div key={stat.label}>
                          <div 
                            className="text-2xl font-bold text-white"
                            style={{ fontFamily: "Orbitron, sans-serif" }}
                          >
                            {stat.value}
                          </div>
                          <div className="text-xs text-white/50">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function LandingFlagshipProjects() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      id="foundations" 
      ref={sectionRef}
      className="relative py-32 px-4 md:px-8 bg-black overflow-hidden"
    >
      {/* Background Glow Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[150px] opacity-20"
          style={{ background: "linear-gradient(135deg, #a855f7, #06b6d4)" }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[150px] opacity-15"
          style={{ background: "linear-gradient(135deg, #06b6d4, #a855f7)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            THE FOUNDATIONS
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Our proprietary projects shaping the future of technology
          </p>
        </motion.div>

        {/* Projects */}
        <div className="space-y-16">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
