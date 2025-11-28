import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight">UNVRS LABS</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Services
            </a>
            <a href="#works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Works
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>

          <Link to="/auth">
            <Button variant="default" className="bg-transparent border border-border hover:bg-accent/10">
              Accedi
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
