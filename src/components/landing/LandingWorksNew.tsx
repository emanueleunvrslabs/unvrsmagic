import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const works = [
  {
    title: "AI-Powered Analytics Platform",
    description: "Enterprise-grade analytics solution",
    image: "/webflow/images/Tavola-disegno-5_102x.png",
  },
  {
    title: "Custom E-Commerce Solution",
    description: "Scalable multi-vendor marketplace",
    image: "/webflow/images/Tavola-disegno-5_122x.png",
  },
  {
    title: "Healthcare Management System",
    description: "HIPAA-compliant patient portal",
    image: "/webflow/images/Tavola-disegno-5_82x.png",
  },
];

export function LandingWorksNew() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="works" ref={ref} className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold text-white text-center mb-16"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Works
        </motion.h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {works.map((work, index) => (
            <motion.div
              key={work.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/30 transition-all cursor-pointer"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={work.image}
                  alt={work.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {work.title}
                </h3>
                <p className="text-white/60 mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {work.description}
                </p>
                <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                  <span className="text-sm font-medium" style={{ fontFamily: "Orbitron, sans-serif" }}>View Work</span>
                  <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
