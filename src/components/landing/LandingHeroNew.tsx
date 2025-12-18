import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const words = ["UNVRS", "LABS"];
const reelLetters = "UNVRSLABS";

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

// Slot machine reel component for a single letter
const SlotReel = ({ 
  targetLetter, 
  delay, 
  isActive 
}: { 
  targetLetter: string; 
  delay: number;
  isActive: boolean;
}) => {
  const [displayLetter, setDisplayLetter] = useState(targetLetter);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    
    setIsSpinning(true);
    const spinDuration = 1500 + delay * 200;
    const intervalSpeed = 100;
    let elapsed = 0;
    
    const spinInterval = setInterval(() => {
      elapsed += intervalSpeed;
      setDisplayLetter(reelLetters[Math.floor(Math.random() * reelLetters.length)]);
      
      if (elapsed >= spinDuration) {
        clearInterval(spinInterval);
        setDisplayLetter(targetLetter);
        setIsSpinning(false);
      }
    }, intervalSpeed);

    return () => clearInterval(spinInterval);
  }, [targetLetter, delay, isActive]);

  return (
    <div className="relative inline-block overflow-hidden px-1">
      <motion.div
        animate={isSpinning ? { 
          y: [0, -10, 0, 10, 0],
        } : { y: 0 }}
        transition={isSpinning ? {
          duration: 0.1,
          repeat: Infinity,
          ease: "linear"
        } : {
          duration: 0.3,
          ease: [0.23, 1, 0.32, 1]
        }}
      >
        <span
          className="inline-block text-[60px] md:text-[100px] lg:text-[140px] font-bold text-white tracking-tighter leading-none"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          {displayLetter}
        </span>
      </motion.div>
    </div>
  );
};

export function LandingHeroNew() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [triggerSpin, setTriggerSpin] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
      setTriggerSpin((prev) => prev + 1);
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
                  <div className="relative inline-flex justify-center items-center">
                    {letters.map((letter, index) => (
                      <SlotReel
                        key={`${triggerSpin}-${index}`}
                        targetLetter={letter}
                        delay={index}
                        isActive={true}
                      />
                    ))}
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
