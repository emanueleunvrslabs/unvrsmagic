import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const heroTexts = ["Unvrs", "Labs", "UNVRS"];

export function LandingHeroNew() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroTexts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const images = [
    "/webflow/images/Tavola-disegno-5_102x.png",
    "/webflow/images/Tavola-disegno-5_122x.png",
    "/webflow/images/Tavola-disegno-5_82x.png",
    "/webflow/images/Tavola-disegno-5_92x.png",
    "/webflow/images/Tavola-disegno-5_42x.png",
    "/webflow/images/Tavola-disegno-5_72x.png",
  ];

  return (
    <section id="home" className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden pt-24">
      {/* Background Grid Images - Left */}
      <div className="absolute left-0 top-0 h-full w-1/4 overflow-hidden">
        <div className="flex flex-col gap-8 animate-[slide-up_20s_linear_infinite]">
          {[...images, ...images].map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 0.3, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="w-full aspect-square"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Grid Images - Right */}
      <div className="absolute right-0 top-0 h-full w-1/4 overflow-hidden">
        <div className="flex flex-col gap-8 animate-[slide-down_20s_linear_infinite]">
          {[...images, ...images].map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 0.3, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="w-full aspect-square"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 text-center px-6">
        <div className="relative h-[200px] md:h-[300px] mb-8 overflow-hidden">
          {heroTexts.map((text, index) => (
            <motion.h1
              key={text}
              initial={{ y: 100, opacity: 0 }}
              animate={{
                y: index === currentIndex ? 0 : index < currentIndex ? -100 : 100,
                opacity: index === currentIndex ? 1 : 0,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 text-[120px] md:text-[200px] font-bold text-white tracking-tighter leading-none"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {text}
            </motion.h1>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Beyond code, we build universes<br />
          where businesses and AI<br />
          evolve together.
        </motion.p>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <a href="#learn-more" className="text-white/50 hover:text-white/80 transition-colors">
          <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </motion.div>

      <style>{`
        @keyframes slide-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes slide-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
