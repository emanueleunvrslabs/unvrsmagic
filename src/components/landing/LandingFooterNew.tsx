import { Link } from "react-router-dom";

export function LandingFooterNew() {
  return (
    <footer className="py-16 bg-black border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Description */}
          <div>
            <img 
              src="/webflow/images/Unvrs-logo-2.png" 
              alt="UNVRS LABS" 
              className="h-12 w-auto mb-4"
            />
            <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Oltre il codice, costruiamo universi dove aziende e AI evolvono insieme.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Link Rapidi
            </h3>
            <div className="flex flex-col gap-2">
              <a href="#home" className="text-white/60 hover:text-white transition-colors text-sm">
                Home
              </a>
              <a href="#about" className="text-white/60 hover:text-white transition-colors text-sm">
                Chi Siamo
              </a>
              <a href="#works" className="text-white/60 hover:text-white transition-colors text-sm">
                Progetti
              </a>
              <a href="#services" className="text-white/60 hover:text-white transition-colors text-sm">
                Servizi
              </a>
              <a href="#contact" className="text-white/60 hover:text-white transition-colors text-sm">
                Contatti
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Contattaci
            </h3>
            <div className="flex flex-col gap-2">
              <a href="mailto:info@unvrslabs.com" className="text-white/60 hover:text-white transition-colors text-sm">
                info@unvrslabs.com
              </a>
              <Link to="/auth" className="text-white/60 hover:text-white transition-colors text-sm">
                Portale Clienti
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
            © {new Date().getFullYear()} UNVRS LABS. Tutti i diritti riservati.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">
              Termini di Servizio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
