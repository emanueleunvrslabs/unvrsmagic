import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo-unvrs.png";

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="liquid-glass-nav w-full top-0 left-0 z-50 px-6 py-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo}
              alt="UNVRS LABS" 
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
            <a href="#home" className="liquid-glass-pill text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs font-medium tracking-wider">
              HOME
            </a>
            <a href="#services" className="liquid-glass-pill text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs font-medium tracking-wider">
              SERVICES
            </a>
            <a href="#works" className="liquid-glass-pill text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs font-medium tracking-wider">
              MAGIC AI
            </a>
            <a href="https://wa.me/447575839334" target="_blank" rel="noopener noreferrer" className="liquid-glass-pill text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs font-medium tracking-wider">
              CONTACT
            </a>
            <Link 
              to="/auth" 
              className="liquid-glass-btn ml-2 px-6 py-2.5 text-white text-xs font-semibold tracking-wider"
            >
              LOGIN
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden liquid-glass-pill p-2 text-white/80 hover:text-white"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 liquid-glass p-6 flex flex-col gap-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
            <a href="#home" className="text-white/80 hover:text-white transition-colors text-sm font-medium py-2" onClick={() => setIsOpen(false)}>
              HOME
            </a>
            <a href="#services" className="text-white/80 hover:text-white transition-colors text-sm font-medium py-2" onClick={() => setIsOpen(false)}>
              SERVICES
            </a>
            <a href="#works" className="text-white/80 hover:text-white transition-colors text-sm font-medium py-2" onClick={() => setIsOpen(false)}>
              MAGIC AI
            </a>
            <a href="https://wa.me/447575839334" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors text-sm font-medium py-2" onClick={() => setIsOpen(false)}>
              CONTACT
            </a>
            <Link 
              to="/auth" 
              className="liquid-glass-btn mt-2 px-6 py-3 text-white text-sm font-semibold tracking-wider text-center"
              onClick={() => setIsOpen(false)}
            >
              LOGIN
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}