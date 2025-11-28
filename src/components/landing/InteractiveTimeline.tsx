import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState } from "react";

const milestones = [
  {
    year: "2020",
    title: "Foundation",
    description: "UNVRS LABS was born with a vision to merge AI and business",
  },
  {
    year: "2021",
    title: "First AI Products",
    description: "Launched our first suite of AI-powered business tools",
  },
  {
    year: "2022",
    title: "Enterprise Scale",
    description: "Expanded to serve Fortune 500 companies globally",
  },
  {
    year: "2023",
    title: "Innovation Hub",
    description: "Opened R&D centers for next-gen AI development",
  },
  {
    year: "2024",
    title: "Future Vision",
    description: "Building the next generation of AI-native businesses",
  },
];

export function InteractiveTimeline() {
  const { ref, isVisible } = useScrollReveal(0.2);
  const [activeIndex, setActiveIndex] = useState(0);

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
          Our Journey
        </motion.h2>

        <div className="relative max-w-6xl mx-auto">
          {/* Timeline line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
            <motion.div
              initial={{ height: 0 }}
              animate={isVisible ? { height: "100%" } : {}}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="w-full"
              style={{
                background: "linear-gradient(to bottom, rgba(55, 255, 139, 0.5), rgba(55, 255, 139, 0.1))",
              }}
            />
          </div>

          {/* Milestones */}
          <div className="space-y-24">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.2 }}
                className={`flex items-center ${
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {/* Content */}
                <div className={`w-5/12 ${index % 2 === 0 ? "text-right pr-12" : "text-left pl-12"}`}>
                  <motion.div
                    animate={{
                      scale: activeIndex === index ? 1.05 : 1,
                      opacity: activeIndex === index ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.3 }}
                    className="p-6 rounded-lg backdrop-blur-sm cursor-pointer"
                    style={{
                      background: "rgba(55, 255, 139, 0.05)",
                      border: activeIndex === index ? "2px solid rgba(55, 255, 139, 0.5)" : "2px solid rgba(55, 255, 139, 0.2)",
                      boxShadow: activeIndex === index ? "0 0 30px rgba(55, 255, 139, 0.2)" : "none",
                    }}
                  >
                    <h3 className="text-3xl font-bold mb-2 font-orbitron" style={{ color: "#37FF8B" }}>
                      {milestone.year}
                    </h3>
                    <h4 className="text-xl font-semibold mb-2 text-white">
                      {milestone.title}
                    </h4>
                    <p className="text-white/70">{milestone.description}</p>
                  </motion.div>
                </div>

                {/* Center dot */}
                <div className="w-2/12 flex justify-center">
                  <motion.div
                    animate={{
                      scale: activeIndex === index ? 1.5 : 1,
                      boxShadow: activeIndex === index
                        ? "0 0 30px rgba(55, 255, 139, 0.6)"
                        : "0 0 10px rgba(55, 255, 139, 0.3)",
                    }}
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: "#37FF8B",
                      border: "3px solid black",
                    }}
                  />
                </div>

                {/* Empty space on other side */}
                <div className="w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
