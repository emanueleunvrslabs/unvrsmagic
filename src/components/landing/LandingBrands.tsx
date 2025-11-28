import { motion } from "framer-motion";
import { BrandCard } from "./BrandCard";

const brands = [
  { name: "OPENAI", logo: "hexagon" },
  { name: "ANTHROPIC", logo: "triangle" },
  { name: "GEMINI", logo: "circle" },
  { name: "META AI", logo: "diamond" },
  { name: "MISTRAL", logo: "star" },
  { name: "COHERE", logo: "octagon" },
  { name: "MIDJOURNEY", logo: "square" },
  { name: "CLAUDE", logo: "pentagon" },
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
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex gap-6 md:gap-12 items-center"
          >
            {[...brands, ...brands].map((brand, i) => (
              <BrandCard key={i} name={brand.name} logoType={brand.logo} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
