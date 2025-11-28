import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingContact() {
  return (
    <section id="contact" className="relative py-32 bg-black border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black tracking-[0.2em] text-white mb-8">
            LET'S TALK
          </h2>
          
          <p className="text-lg md:text-xl text-white/70 font-light mb-16 tracking-wide">
            Ready to build your universe? Get in touch.
          </p>
          
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-16">
            <a
              href="mailto:info@unvrslabs.com"
              className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span className="text-lg">info@unvrslabs.com</span>
            </a>
            <a
              href="tel:+393401234567"
              className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span className="text-lg">+39 340 123 4567</span>
            </a>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center text-sm text-white/50">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>© {new Date().getFullYear()} UNVRS LABS</span>
          </div>
        </div>
      </div>
    </section>
  );
}
