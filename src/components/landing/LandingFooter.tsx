import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-border/40 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4">UNVRS LABS</h3>
            <p className="text-muted-foreground">
              Innovazione AI per il futuro digitale
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Prodotti</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
                  AI Social
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
                  Trading AI
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
                  Automation
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Azienda</h4>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                  Chi Siamo
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contatti</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>info@unvrslabs.com</li>
              <li>+39 XXX XXX XXXX</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/40">
          <p className="text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} UNVRS LABS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
