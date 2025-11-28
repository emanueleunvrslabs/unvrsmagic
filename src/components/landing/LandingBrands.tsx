import { motion } from "framer-motion";
import { BrandCard } from "./BrandCard";
import openaiLogo from "@/assets/ai-logos/openai-transparent.png";
import claudeLogo from "@/assets/ai-logos/claude-transparent.png";
import geminiLogo from "@/assets/ai-logos/gemini-transparent.png";
import metaLogo from "@/assets/ai-logos/meta-transparent.png";
import qwen3Logo from "@/assets/ai-logos/qwen3-transparent.png";
import cohereLogo from "@/assets/ai-logos/cohere.png";
import midjourneyLogo from "@/assets/ai-logos/midjourney-icon.png";
import huggingfaceLogo from "@/assets/ai-logos/huggingface.png";

const brands = [
  { name: "OPENAI", logoUrl: openaiLogo },
  { name: "CLAUDE 4.5", logoUrl: claudeLogo },
  { name: "GEMINI", logoUrl: geminiLogo },
  { name: "META AI", logoUrl: metaLogo },
  { name: "QWEN3", logoUrl: qwen3Logo },
  { name: "COHERE", logoUrl: cohereLogo },
  { name: "MIDJOURNEY", logoUrl: midjourneyLogo },
  { name: "HUGGING FACE", logoUrl: huggingfaceLogo },
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
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex gap-6 md:gap-12 items-center"
          >
            {[...brands, ...brands].map((brand, i) => (
              <BrandCard key={i} name={brand.name} logoUrl={brand.logoUrl} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
