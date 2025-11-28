import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { CyberCard } from "./CyberCard";

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
            >
              <CyberCard
                title={service.title}
                description={service.description}
                delay={index * 100}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
