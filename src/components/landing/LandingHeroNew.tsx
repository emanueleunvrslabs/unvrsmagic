import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const useTypewriter = (text: string, baseSpeed: number = 50) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const currentChar = text[currentIndex];
      
      // Velocità variabile per simulare digitazione umana
      let speed = baseSpeed + Math.random() * 40;
      
      // Pause più lunghe dopo punteggiatura
      if ([',', '.', ';', '\n', '{', '}'].includes(currentChar)) {
        speed += 100 + Math.random() * 200;
      }
      
      // Pause dopo spazi
      if (currentChar === ' ') {
        speed += 20 + Math.random() * 30;
      }
      
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    } else {
      // Quando finisce, aspetta 2 secondi e riparte
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

  const images = [
    "/webflow/images/Tavola-disegno-5_102x.png",
    "/webflow/images/Tavola-disegno-5_122x.png",
    "/webflow/images/Tavola-disegno-5_82x.png",
    "/webflow/images/Tavola-disegno-5_92x.png",
    "/webflow/images/Tavola-disegno-5_42x.png",
    "/webflow/images/Tavola-disegno-5_72x.png",
  ];

  return (
    <section id="home" className="relative min-h-screen bg-black flex items-start justify-center overflow-hidden pt-32">
      {/* Center Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto mt-12">
        <div className="relative h-[180px] md:h-[280px] mb-6 flex items-center justify-center">
          <div className="relative inline-flex justify-center items-center min-w-[400px] md:min-w-[700px] lg:min-w-[900px]" style={{ fontFamily: "Inter, sans-serif" }}>
            <AnimatePresence>
              <motion.div
                key={currentIndex}
                className="absolute inset-0 flex justify-center items-center"
              >
                {letters.map((letter, index) => (
                  <div key={index} className="relative inline-block overflow-y-hidden px-2">
                    <motion.span
                      initial={{ y: "100%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "-100%" }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.06,
                        ease: [0.43, 0.13, 0.23, 0.96]
                      }}
                      className="inline-block text-[80px] md:text-[140px] lg:text-[180px] font-bold text-white tracking-tighter leading-none"
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

        <motion.pre
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="text-base md:text-lg lg:text-xl max-w-3xl mx-auto text-center whitespace-pre-wrap"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          <code>
            {(() => {
              const lines = typewriterText.split('\n');
              return lines.map((line, lineIdx) => (
                <div key={lineIdx}>
                  {line.split(/(\bfunction\b|\breturn\b|buildUniverse|"[^"]*")/).map((token, tokenIdx) => {
                    if (token === 'function') {
                      return <span key={tokenIdx} className="text-fuchsia-500">{token}</span>;
                    } else if (token === 'return') {
                      return <span key={tokenIdx} className="text-blue-400">{token}</span>;
                    } else if (token === 'buildUniverse') {
                      return <span key={tokenIdx} className="text-yellow-300">{token}</span>;
                    } else if (token.startsWith('"')) {
                      return <span key={tokenIdx} className="text-green-400">{token}</span>;
                    }
                    return <span key={tokenIdx} className="text-white/90">{token}</span>;
                  })}
                </div>
              ));
            })()}
            <span className="animate-pulse">_</span>
          </code>
        </motion.pre>
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
