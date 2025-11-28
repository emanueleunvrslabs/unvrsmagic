import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function LandingLearnMore() {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-100px" });

  const title1 = "We Don't Just Design for the Present".split(" ");
  const title2 = "We Craft Experiences for the Future".split(" ");
  const description = "Specializing in developing enterprise software, custom applications, and AI integrations, delivering innovative and scalable solutions that create real value for businesses across all digital platforms.".split(" ");

  return (
    <section id="learn-more" ref={ref} className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <h2 
            className="text-4xl md:text-6xl font-light text-white mb-8 leading-tight"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            <div className="mb-4 flex flex-wrap gap-x-4">
              {title1.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.6,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
              <span className="inline-block">❌</span>
            </div>
            <div className="flex flex-wrap gap-x-4">
              {title2.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                  transition={{ 
                    delay: (title1.length * 0.1) + (index * 0.1),
                    duration: 0.6,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                  className="inline-block text-white/90"
                >
                  {word}
                </motion.span>
              ))}
              <span className="inline-block">🔮</span>
            </div>
          </h2>

          <div className="text-white/70 text-lg md:text-xl leading-relaxed flex flex-wrap gap-x-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {description.map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ 
                  delay: (title1.length * 0.1) + (title2.length * 0.1) + 0.3 + (index * 0.03),
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
