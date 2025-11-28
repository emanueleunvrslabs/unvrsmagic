import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface StatProps {
  value: number;
  label: string;
  suffix?: string;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 3.5,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toString() + suffix;
      }
    });
    return unsubscribe;
  }, [rounded, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

function StatItem({ value, label, suffix }: StatProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8 }}
      className="text-center"
    >
      <div
        className="text-7xl md:text-8xl font-bold text-white mb-4"
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      <p
        className="text-white/60 text-sm tracking-[0.2em] uppercase"
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        {label}
      </p>
    </motion.div>
  );
}

export function LandingStats() {
  const stats: StatProps[] = [
    { value: 150, label: "Projects Completed", suffix: "+" },
    { value: 98, label: "Client Satisfaction", suffix: "%" },
    { value: 24, label: "Team Members" },
  ];

  return (
    <section className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Every number tells a story.
              <br />
              <span className="text-white/60">
                And we're here to help you make sense of it.
              </span>
            </h2>
            <p
              className="text-white/70 text-lg leading-relaxed"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Unleash the power of creativity with UNVRS LABS. Our passion is crafting unique brand
              stories that resonate and engage. Whether it's through stunning design, innovative
              digital experiences, or dynamic marketing strategies, we transform your vision into
              impactful realities. Let's create something unforgettable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-16">
            {stats.map((stat, index) => (
              <StatItem
                key={index}
                value={stat.value}
                label={stat.label}
                suffix={stat.suffix}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
