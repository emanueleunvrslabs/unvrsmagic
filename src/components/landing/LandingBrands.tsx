import { motion } from "framer-motion";
import openaiLogo from "@/assets/ai-logos/openai-transparent.png";
import claudeLogo from "@/assets/ai-logos/claude-transparent.png";
import geminiLogo from "@/assets/ai-logos/gemini-transparent.png";
import metaLogo from "@/assets/ai-logos/meta-transparent.png";
import qwen3Logo from "@/assets/ai-logos/qwen3-transparent.png";
import cohereLogo from "@/assets/ai-logos/cohere.png";
import huggingfaceLogo from "@/assets/ai-logos/huggingface.png";

const brands = [
  { name: "OPENAI", logoUrl: openaiLogo },
  { name: "CLAUDE", logoUrl: claudeLogo },
  { name: "GEMINI", logoUrl: geminiLogo },
  { name: "META AI", logoUrl: metaLogo },
  { name: "QWEN3", logoUrl: qwen3Logo },
  { name: "COHERE", logoUrl: cohereLogo },
  { name: "HUGGING FACE", logoUrl: huggingfaceLogo },
];

export function LandingBrands() {
  return (
    <section className="py-20 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-white/40 text-sm mb-12 tracking-wider"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          POWERED BY LEADING AI TECHNOLOGIES
        </motion.p>

        {/* Infinite scroll container */}
        <div className="relative">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          <div className="flex overflow-hidden">
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="flex gap-6 shrink-0"
            >
              {[...brands, ...brands, ...brands, ...brands].map((brand, index) => (
                <div
                  key={`${brand.name}-${index}`}
                  className="liquid-glass-pill flex items-center justify-center px-8 py-4 shrink-0 hover:bg-white/10 transition-all duration-300"
                >
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 filter brightness-0 invert"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}