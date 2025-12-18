import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const words = ["UNVRS", "LABS"];

interface ShinyTextProps {
  text: string;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ShinyText = ({ text, speed = 3, className = "", style }: ShinyTextProps) => {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        ...style,
        backgroundImage: `linear-gradient(
          120deg,
          rgba(255, 255, 255, 0.5) 40%,
          rgba(255, 255, 255, 1) 50%,
          rgba(255, 255, 255, 0.5) 60%
        )`,
        backgroundSize: "200% 100%",
        animation: `shiny-text ${speed}s linear infinite`,
        WebkitBackgroundClip: "text",
      }}
    >
      {text}
    </span>
  );
};

export function LandingHeroNew() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentWord = words[currentIndex];
  const letters = currentWord.split("");

  return (
    <>
      <style>{`
        @keyframes shiny-text {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: -100% 50%;
          }
        }
      `}</style>
      <section id="home" className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden pt-24">
        {/* Black background */}
        <div className="absolute inset-0 bg-black" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center gap-12">
            {/* Title - Centered */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <p
                  className="text-white/60 text-sm mb-4 tracking-widest"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  WELCOME TO
                </p>

                <div className="relative h-[140px] md:h-[200px] mb-6 flex items-center justify-center">
                  <div className="relative inline-flex justify-center items-center" style={{ fontFamily: "Inter, sans-serif" }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        className="flex"
                      >
                        {letters.map((letter, index) => (
                          <div key={index} className="relative inline-block overflow-y-hidden px-1">
                            <motion.span
                              initial={{ y: "100%" }}
                              animate={{ y: "0%" }}
                              exit={{ y: "-100%" }}
                              transition={{ 
                                duration: 0.5, 
                                delay: index * 0.06,
                                ease: [0.43, 0.13, 0.23, 0.96]
                              }}
                              className="inline-block text-[60px] md:text-[100px] lg:text-[140px] font-bold text-white tracking-tighter leading-none"
                              style={{ fontFamily: "Orbitron, sans-serif" }}
                            >
                              {letter}
                            </motion.span>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <ShinyText 
                  text="Coding the Universe, One Pixel at a Time"
                  speed={3}
                  className="text-lg md:text-xl max-w-md mx-auto leading-relaxed"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                />
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.a
              href="#learn-more"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col items-center gap-2 cursor-pointer group mt-8"
            >
              <span
                className="text-white/50 text-xs tracking-widest group-hover:text-white/80 transition-colors"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                SCROLL
              </span>
              <div className="liquid-glass-pill p-2 animate-bounce">
                <ChevronDown size={20} className="text-white/70" />
              </div>
            </motion.a>
          </div>
        </div>
      </section>
    </>
  );
}
