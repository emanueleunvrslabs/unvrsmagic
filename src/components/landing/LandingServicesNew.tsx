import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const services = [
  {
    title: "AI Integration",
    description: "Seamlessly integrate cutting-edge AI solutions into your existing infrastructure for enhanced automation and insights.",
  },
  {
    title: "Custom Software",
    description: "Tailored enterprise applications built from the ground up to match your unique business requirements.",
  },
  {
    title: "Cloud Architecture",
    description: "Design and implement scalable cloud infrastructure that grows with your business needs.",
  },
  {
    title: "Mobile Applications",
    description: "Native and cross-platform mobile solutions that deliver exceptional user experiences.",
  },
  {
    title: "Consulting & Strategy",
    description: "Expert guidance on digital transformation and technology roadmap planning.",
  },
  {
    title: "DevOps & Automation",
    description: "Streamline your development pipeline with modern DevOps practices and automation.",
  },
];

export function LandingServicesNew() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" ref={ref} className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold text-white text-center mb-16"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Services
        </motion.h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all cursor-pointer"
            >
              <h2 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {service.title}
              </h2>
              <p className="text-white/60 mb-6 leading-relaxed" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {service.description}
              </p>
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 group-hover:border-white/40 transition-all">
                <ArrowUpRight size={20} className="text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
