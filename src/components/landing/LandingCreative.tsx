import teamImage from "@/assets/landing/team-image.jpeg";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useParallax } from "@/hooks/useParallax";

export function LandingCreative() {
  const { ref, isVisible } = useScrollReveal();
  const { ref: parallaxRef, offset } = useParallax(0.3);
  
  return (
    <section 
      ref={ref}
      className={`relative py-32 bg-black transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-light text-white/90 mb-16 text-center tracking-wide leading-relaxed">
            Every number tells a story.{" "}
            <span className="inline-block">And we're here to help you make sense of it.</span>
          </h3>
          
          <div ref={parallaxRef as any} className="aspect-video rounded-3xl overflow-hidden mb-16">
            <img
              src={teamImage}
              alt="UNVRS Labs Team"
              className="w-full h-full object-cover transition-transform duration-100"
              style={{ transform: `translateY(${-offset * 0.5}px)` }}
            />
          </div>
          
          <div className="text-center space-y-6">
            <p className="text-base md:text-lg text-white/80 font-light tracking-wide leading-relaxed">
              Unleash the power of creativity with UNVRS LABS.
            </p>
            <p className="text-base md:text-lg text-white/70 font-light tracking-wide leading-relaxed max-w-3xl mx-auto">
              Our passion is crafting unique brand stories that resonate and engage. Whether it's through
              stunning design, innovative digital experiences, or dynamic marketing strategies, we transform
              your vision into impactful realities.
            </p>
            <p className="text-base md:text-lg text-white/70 font-light tracking-wide leading-relaxed">
              Let's create something extraordinary together.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
