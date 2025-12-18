import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const useTypewriter = (text: string, baseSpeed: number = 50) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const currentChar = text[currentIndex];
      let speed = baseSpeed + Math.random() * 40;
      
      if ([',', '.', ';', '\n', '{', '}'].includes(currentChar)) {
        speed += 100 + Math.random() * 200;
      }
      if (currentChar === ' ') {
        speed += 20 + Math.random() * 30;
      }
      
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    } else {
      const resetTimeout = setTimeout(() => {
        setDisplayedText("");
        setCurrentIndex(0);
      }, 2000);
      
      return () => clearTimeout(resetTimeout);
    }
  }, [currentIndex, text, baseSpeed]);

  return displayedText;
};

const words = ["UNVRS", "LABS"];

export function LandingHeroNew() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const fullCode = `function buildUniverse() {
  return "Beyond code, we build universes
where businesses and AI evolve together.";
}`;
  
  const typewriterText = useTypewriter(fullCode, 30);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentWord = words[currentIndex];
  const letters = currentWord.split("");

  return (
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

              <p
                className="text-white/70 text-lg md:text-xl max-w-md mx-auto leading-relaxed"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Coding the Universe, One Pixel at a Time
              </p>
            </motion.div>
          </div>

          {/* Code Container - Centered below title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-2xl"
          >
            <div className="liquid-glass-card liquid-glass-glow p-8 relative">
              {/* Window controls */}
              <div className="flex gap-2 mb-6 relative z-10">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>

              {/* Code content */}
              <pre
                className="font-mono text-sm text-white/90 whitespace-pre-wrap leading-relaxed relative z-10"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                <code>
                  {(() => {
                    const lines = typewriterText.split('\n');
                    return lines.map((line, lineIdx) => (
                      <div key={lineIdx}>
                        {line.split(/(\bfunction\b|\breturn\b|buildUniverse|"[^"]*")/).map((token, tokenIdx) => {
                          if (token === 'function') {
                            return <span key={tokenIdx} style={{ color: '#37FF8B' }}>{token}</span>;
                          } else if (token === 'return') {
                            return <span key={tokenIdx} style={{ color: '#37FF8B' }}>{token}</span>;
                          } else if (token === 'buildUniverse') {
                            return <span key={tokenIdx} style={{ color: '#37FF8B' }}>{token}</span>;
                          } else if (token.startsWith('"')) {
                            return <span key={tokenIdx} className="text-cyan-400">{token}</span>;
                          }
                          return <span key={tokenIdx} className="text-white/90">{token}</span>;
                        })}
                      </div>
                    ));
                  })()}
                  <span className="inline-block w-2 h-5 bg-white/80 animate-pulse ml-1" />
                </code>
              </pre>
            </div>
          </motion.div>

          {/* Scroll indicator - below code card */}
          <motion.a
            href="#learn-more"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
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
  );
}