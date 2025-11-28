import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const techs = [
  { name: "React", color: "#61DAFB" },
  { name: "TypeScript", color: "#3178C6" },
  { name: "Node.js", color: "#339933" },
  { name: "Python", color: "#3776AB" },
  { name: "AI/ML", color: "#FF6B6B" },
  { name: "Cloud", color: "#FF9500" },
];

export function TechStackOrbit() {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section ref={ref} className="py-32 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold text-center mb-20 font-orbitron"
          style={{ color: "#37FF8B" }}
        >
          Our Tech Universe
        </motion.h2>

        <div className="relative w-full max-w-2xl mx-auto h-[500px] flex items-center justify-center">
          {/* Central core */}
          <motion.div
            initial={{ scale: 0 }}
            animate={isVisible ? { scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute w-32 h-32 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(55, 255, 139, 0.1)",
              border: "2px solid rgba(55, 255, 139, 0.5)",
              boxShadow: "0 0 40px rgba(55, 255, 139, 0.3)",
            }}
          >
            <span className="text-2xl font-bold font-orbitron" style={{ color: "#37FF8B" }}>
              UNVRS
            </span>
          </motion.div>

          {/* Orbiting technologies */}
          {techs.map((tech, index) => {
            const angle = (index / techs.length) * 2 * Math.PI;
            const radius = 200;

            return (
              <motion.div
                key={tech.name}
                className="absolute"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  isVisible
                    ? {
                        scale: 1,
                        opacity: 1,
                        x: [
                          Math.cos(angle) * radius,
                          Math.cos(angle + Math.PI * 2) * radius,
                        ],
                        y: [
                          Math.sin(angle) * radius,
                          Math.sin(angle + Math.PI * 2) * radius,
                        ],
                      }
                    : {}
                }
                transition={{
                  scale: { duration: 0.5, delay: 0.3 + index * 0.1 },
                  opacity: { duration: 0.5, delay: 0.3 + index * 0.1 },
                  x: {
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  },
                  y: {
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
                style={{
                  left: "50%",
                  top: "50%",
                }}
              >
                <div
                  className="px-6 py-3 rounded-full font-semibold backdrop-blur-sm"
                  style={{
                    background: `${tech.color}20`,
                    border: `2px solid ${tech.color}`,
                    color: tech.color,
                    boxShadow: `0 0 20px ${tech.color}50`,
                  }}
                >
                  {tech.name}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
