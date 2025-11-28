import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function LandingLearnMore() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="learn-more" ref={ref} className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <h2 
            className="text-4xl md:text-6xl font-light text-white mb-8 leading-tight"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            We Don't Just Design for the Present{" "}
            <span className="inline-block">❌</span>
            <br />
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-white/90"
            >
              We Craft Experiences for the Future{" "}
              <span className="inline-block">🔮</span>
            </motion.span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-white/70 text-lg md:text-xl leading-relaxed"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Specializing in developing enterprise software, custom applications, and AI integrations,
            delivering innovative and scalable solutions that create real value for businesses across all digital platforms.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
