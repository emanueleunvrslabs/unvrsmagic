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
      <div className="absolute left-0 top-0 h-full w-[15%] overflow-hidden opacity-20">
        <div className="flex flex-col gap-6 animate-[slide-up_25s_linear_infinite]">
          {[...images, ...images].map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="w-full aspect-square"
            >
              <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Grid Images - Right */}
      <div className="absolute right-0 top-0 h-full w-[15%] overflow-hidden opacity-20">
        <div className="flex flex-col gap-6 animate-[slide-down_25s_linear_infinite]">
          {[...images, ...images].map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="w-full aspect-square"
            >
              <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <div className="relative h-[180px] md:h-[280px] mb-12 flex items-center justify-center">
          {heroTexts.map((text, index) => (
            <motion.h1
              key={text}
              initial={{ y: 100, opacity: 0 }}
              animate={{
                y: index === currentIndex ? 0 : index < currentIndex ? -100 : 100,
                opacity: index === currentIndex ? 1 : 0,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute text-[80px] md:text-[140px] lg:text-[180px] font-bold text-white tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              style={{ 
                fontFamily: "Inter, sans-serif",
                textShadow: "0 0 40px rgba(255, 255, 255, 0.2), 0 0 80px rgba(255, 255, 255, 0.1)"
              }}
            >
              {text}
            </motion.h1>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-white/90 text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-lg"
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
