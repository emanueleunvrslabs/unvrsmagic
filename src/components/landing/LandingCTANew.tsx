import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

export function LandingCTANew() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" ref={ref} className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 
            className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Ready to Build<br />Your Universe?
          </h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-white/70 text-xl mb-12 leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Let's collaborate to create innovative solutions that drive your business forward.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link 
              to="/auth"
              className="inline-block px-12 py-4 bg-white text-black text-lg font-semibold rounded-full hover:bg-white/90 transition-all hover:scale-105"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Get Started
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
