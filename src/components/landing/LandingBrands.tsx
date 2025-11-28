import { motion } from "framer-motion";

const brands = [
  "/webflow/images/DuneLight.svg",
  "/webflow/images/InvertLight.svg",
  "/webflow/images/PentaLight.svg",
  "/webflow/images/TerraLight.svg",
  "/webflow/images/Iceberglight.svg",
  "/webflow/images/PinpointLight.svg",
  "/webflow/images/HitechLight.svg",
  "/webflow/images/ProLineLight.svg",
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
