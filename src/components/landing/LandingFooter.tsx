import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 pb-8">
      <nav className="flex items-center justify-center gap-4 md:gap-8">
        <a
          href="#home"
          className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/20"
        >
          HOME
        </a>
        <a
          href="#about"
          className="px-6 py-2 text-white/70 text-sm font-medium hover:text-white transition-colors"
        >
          ABOUT
        </a>
        <a
          href="#contact"
          className="px-6 py-2 text-white/70 text-sm font-medium hover:text-white transition-colors"
        >
          CONTACT
        </a>
        <button className="px-6 py-2 text-white/70 text-sm font-medium hover:text-white transition-colors flex items-center gap-1">
          MORE
          <ChevronDown className="w-4 h-4" />
        </button>
        <Link to="/auth">
          <Button
            variant="outline"
            className="bg-transparent border-white/20 text-white hover:bg-white/10"
          >
            ACCEDI
          </Button>
        </Link>
      </nav>
    </footer>
  );
}
