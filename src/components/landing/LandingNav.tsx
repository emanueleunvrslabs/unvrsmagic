import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo-unvrs.png";

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
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8" style={{ fontFamily: "Orbitron, sans-serif" }}>
            <a href="#home" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              HOME
            </a>
            <a href="#services" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              SERVICES
            </a>
            <a href="#works" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              MAGIC AI
            </a>
            <a href="https://wa.me/447575839334" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              CONTACT
            </a>
            <Link 
              to="/auth" 
              className="login-button"
            >
              <span className="actual-text">Magic AI</span>
              <span aria-hidden="true" className="hover-text">Magic AI</span>
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
            <a href="#services" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              SERVICES
            </a>
            <a href="#works" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              MAGIC AI
            </a>
            <a href="https://wa.me/447575839334" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/70 transition-colors text-sm font-medium">
              CONTACT
            </a>
            <Link 
              to="/auth" 
              className="login-button"
            >
              <span className="actual-text">Magic AI</span>
              <span aria-hidden="true" className="hover-text">Magic AI</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
