import { motion } from "framer-motion";
import nexusTech from "@/assets/logos/nexus-tech.png";
import apexSystems from "@/assets/logos/apex-systems.png";
import quantumDigital from "@/assets/logos/quantum-digital.png";
import vertexLabs from "@/assets/logos/vertex-labs.png";
import prismVentures from "@/assets/logos/prism-ventures.png";
import forgeIndustries from "@/assets/logos/forge-industries.png";
import zenithCorp from "@/assets/logos/zenith-corp.png";
import catalystPartners from "@/assets/logos/catalyst-partners.png";

const brands = [
  nexusTech,
  apexSystems,
  quantumDigital,
  vertexLabs,
  prismVentures,
  forgeIndustries,
  zenithCorp,
  catalystPartners,
];

export function LandingBrands() {
  return (
    <section className="py-20 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex gap-12 items-center"
          >
            {[...brands, ...brands].map((src, i) => (
              <div key={i} className="flex-shrink-0">
                <img 
                  src={src} 
                  alt="Brand logo" 
                  className="h-16 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
