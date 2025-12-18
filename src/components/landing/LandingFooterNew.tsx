import { Link } from "react-router-dom";
import logo from "@/assets/logo-unvrs.png";

export function LandingFooterNew() {
  return (
    <footer className="py-16 bg-black relative">
      {/* Top border with glass effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Description */}
          <div>
            <img 
              src={logo}
              alt="UNVRS LABS" 
              className="h-14 w-auto mb-4"
            />
            <p className="text-white font-semibold text-lg mb-3" style={{ fontFamily: "Orbitron, sans-serif" }}>
              UNVRS LABS
            </p>
            <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Coding the Universe, One Pixel at a Time
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm tracking-wider" style={{ fontFamily: "Orbitron, sans-serif" }}>
              QUICK LINKS
            </h3>
            <div className="flex flex-col gap-3">
              {["Home", "Services", "Magic AI", "Contact"].map((item) => (
                <a 
                  key={item}
                  href={item === "Contact" ? "#contact" : item === "Services" ? "#services" : item === "Magic AI" ? "#works" : "#home"} 
                  className="text-white/60 hover:text-white transition-colors text-sm"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm tracking-wider" style={{ fontFamily: "Orbitron, sans-serif" }}>
              GET IN TOUCH
            </h3>
            <div className="flex flex-col gap-3">
              <a href="mailto:emanuele@unvrslabs.dev" className="text-white/60 hover:text-white transition-colors text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
                emanuele@unvrslabs.dev
              </a>
              <Link 
                to="/auth" 
                className="liquid-glass-pill inline-block w-fit text-white/80 hover:text-white text-xs"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Client Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs" style={{ fontFamily: "Orbitron, sans-serif" }}>
            © {new Date().getFullYear()} UNVRS LABS. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-white/40 hover:text-white/70 transition-colors text-xs" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-white/40 hover:text-white/70 transition-colors text-xs" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}