import { motion } from "framer-motion";
import cdeLogo from "@/assets/partners/cde-extreme.png";
import attivapiuLogo from "@/assets/partners/attivapiu.svg";
import azureLogo from "@/assets/partners/azure.svg";
import microsoftLogo from "@/assets/partners/microsoft.svg";
import googleLogo from "@/assets/partners/google.svg";

const partners = [
  { name: "CDE Extreme OPC", logoUrl: cdeLogo, href: "https://cdextremeopc.com", invert: false },
  { name: "ATTIVApiù", logoUrl: attivapiuLogo, href: "https://attivapiu.it", invert: false },
  { name: "Microsoft", logoUrl: microsoftLogo, href: "https://www.microsoft.com", invert: true },
  { name: "Microsoft Azure", logoUrl: azureLogo, href: "https://azure.microsoft.com", invert: true },
  { name: "Google", logoUrl: googleLogo, href: "https://www.google.com", invert: true },
];

export function LandingPartners() {
  return (
    <section className="py-20 bg-black overflow-hidden" aria-label="Partners">
      <div className="container mx-auto px-6">
        <p
          className="text-center text-white/40 text-sm mb-12 tracking-wider"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          OUR PARTNERS
        </p>

        <div className="flex flex-wrap justify-center items-center gap-6">
          {partners.map((partner, index) => (
            <motion.a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="liquid-glass-pill flex items-center justify-center px-8 py-4 hover:bg-white/10 transition-all duration-300 group"
            >
              <img
                src={partner.logoUrl}
                alt={partner.name}
                className={`h-8 w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${
                  partner.invert ? "filter brightness-0 invert" : ""
                }`}
              />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
