import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/landing/unvrs-logo.png";

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo}
              alt="UNVRS LABS" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8" style={{ fontFamily: "Orbitron, sans-serif" }}>
            <a href="#home" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              HOME
            </a>
            <a href="#about" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              ABOUT
            </a>
            <a href="#works" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              WORKS
            </a>
            <a href="#services" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              SERVICES
            </a>
            <a href="#contact" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              CONTACT
            </a>
            <Link 
              to="/auth" 
              className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/20 rounded-full"
            >
              ACCEDI
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
            <a href="#home" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              HOME
            </a>
            <a href="#about" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              ABOUT
            </a>
            <a href="#works" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              WORKS
            </a>
            <a href="#services" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              SERVICES
            </a>
            <a href="#contact" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              CONTACT
            </a>
            <Link 
              to="/auth" 
              className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/20 rounded-full text-center"
            >
              ACCEDI
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
