import { useEffect, useRef, useState } from "react";

export function LandingClaim() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl text-left">
          <h2 className={`font-orbitron text-3xl md:text-5xl lg:text-6xl font-semibold text-white mb-8 tracking-wide leading-tight transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
            We Don't Just Design<br />
            for the Present{" "}
            <span className="inline-block">❌</span>
          </h2>
          <h2 className={`font-orbitron text-3xl md:text-5xl lg:text-6xl font-semibold text-white mb-16 tracking-wide leading-tight transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
            We Craft Experiences<br />
            for the Future{" "}
            <span className="inline-block">🔮</span>
          </h2>
          
          <p className={`font-orbitron text-base md:text-lg text-white/70 font-light tracking-wide leading-relaxed max-w-3xl transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Specializing in developing enterprise software, custom applications, and AI integrations,
            delivering innovative and scalable solutions that create real value for businesses across all digital platforms.
          </p>
        </div>
      </div>
    </section>
  );
}
