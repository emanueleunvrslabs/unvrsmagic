import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { ShapeBlur } from "./ShapeBlur";

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
    >
      <ShapeBlur
        className="liquid-glass-card p-8 text-center rounded-2xl overflow-hidden"
        shapeSize={1.0}
        roundness={0.5}
        borderSize={0.05}
        circleSize={0.25}
        circleEdge={1}
      >
        <div
          className="text-5xl md:text-6xl font-bold text-white mb-4"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
        <p
          className="text-white/60 text-sm tracking-[0.15em] uppercase"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          {label}
        </p>
      </ShapeBlur>
    </motion.div>
  );
}

export function LandingStats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats: StatProps[] = [
    { value: 150, label: "Projects Completed", suffix: "+" },
    { value: 98, label: "Client Satisfaction", suffix: "%" },
    { value: 24, label: "Team Members" },
  ];

  return (
    <section className="py-32 bg-black relative overflow-hidden" ref={ref}>
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <p
              className="text-white/60 text-sm mb-4 tracking-wider"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Our Track Record
            </p>
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
              impactful realities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6">
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