import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full top-6 left-0 z-50 px-6">
      <div className="container mx-auto flex justify-center">
        {/* Apple-style centered pill menu */}
        <div 
          className="inline-flex items-center gap-1 px-2 py-2 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            border: '0.5px solid rgba(255, 255, 255, 0.15)',
            boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1" style={{ fontFamily: "Orbitron, sans-serif" }}>
            <a 
              href="#home" 
              className="px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs font-medium tracking-wider"
            >
              HOME
            </a>
            <a 
              href="#services" 
              className="px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs font-medium tracking-wider"
            >
              SERVICES
            </a>
            <a 
              href="#works" 
              className="px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs font-medium tracking-wider"
            >
              MAGIC AI
            </a>
            <a 
              href="https://wa.me/447575839334" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 text-xs font-medium tracking-wider"
            >
              CONTACT
            </a>
            <Link 
              to="/auth" 
              className="ml-1 px-5 py-2 rounded-full text-white text-xs font-semibold tracking-wider transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '0.5px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              LOGIN
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-4 mx-auto max-w-xs">
          <div 
            className="p-4 rounded-3xl flex flex-col gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(40px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
              border: '0.5px solid rgba(255, 255, 255, 0.15)',
              boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)',
              fontFamily: "Orbitron, sans-serif"
            }}
          >
            <a 
              href="#home" 
              className="px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium text-center"
              onClick={() => setIsOpen(false)}
            >
              HOME
            </a>
            <a 
              href="#services" 
              className="px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium text-center"
              onClick={() => setIsOpen(false)}
            >
              SERVICES
            </a>
            <a 
              href="#works" 
              className="px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium text-center"
              onClick={() => setIsOpen(false)}
            >
              MAGIC AI
            </a>
            <a 
              href="https://wa.me/447575839334" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium text-center"
              onClick={() => setIsOpen(false)}
            >
              CONTACT
            </a>
            <Link 
              to="/auth" 
              className="mt-2 px-4 py-3 rounded-2xl text-white text-sm font-semibold text-center transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '0.5px solid rgba(255, 255, 255, 0.2)',
              }}
              onClick={() => setIsOpen(false)}
            >
              LOGIN
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
