import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function LandingHero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Innovazione AI per il
            <span className="text-primary"> Tuo Business</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Trasformiamo le tue idee in soluzioni digitali intelligenti attraverso l'intelligenza artificiale e il design innovativo
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-transparent border border-border hover:bg-accent/10">
                Inizia Ora
              </Button>
            </Link>
            <a href="#services">
              <Button size="lg" variant="outline" className="bg-transparent border border-border hover:bg-accent/10">
                Scopri di Più
              </Button>
            </a>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
