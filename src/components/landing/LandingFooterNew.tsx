import { Link } from "react-router-dom";
import logo from "@/assets/logo-unvrs.png";

export function LandingFooterNew() {
  return (
    <footer className="py-16 bg-black border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Description */}
          <div>
            <img 
              src={logo}
              alt="UNVRS LABS" 
              className="h-16 w-auto mb-3"
            />
            <p className="text-white font-semibold text-lg mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
              UNVRS LABS - Coding the Universe
            </p>
            <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Beyond code, we build universes where businesses and AI evolve together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Quick Links
            </h3>
            <div className="flex flex-col gap-2">
              <a href="#home" className="text-white/60 hover:text-white transition-colors text-sm">
                Home
              </a>
              <a href="#about" className="text-white/60 hover:text-white transition-colors text-sm">
                About
              </a>
              <a href="#works" className="text-white/60 hover:text-white transition-colors text-sm">
                Works
              </a>
              <a href="#services" className="text-white/60 hover:text-white transition-colors text-sm">
                Services
              </a>
              <a href="#contact" className="text-white/60 hover:text-white transition-colors text-sm">
                Contact
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Get in Touch
            </h3>
            <div className="flex flex-col gap-2">
              <a href="mailto:info@unvrslabs.com" className="text-white/60 hover:text-white transition-colors text-sm">
                info@unvrslabs.com
              </a>
              <Link to="/auth" className="text-white/60 hover:text-white transition-colors text-sm">
                Client Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
            © {new Date().getFullYear()} UNVRS LABS. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
