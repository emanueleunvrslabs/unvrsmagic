import { WaveTextEntrance } from "./WaveTextEntrance";
import { ScrollReveal } from "./ScrollReveal";

export function LandingClaim() {
  return (
    <section id="learn-more" className="relative py-32 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl text-left">
          <h2 className="font-orbitron text-3xl md:text-5xl lg:text-6xl font-semibold text-white mb-8 tracking-wide leading-tight">
            <WaveTextEntrance text="We Don't Just Design" className="block" />
            <WaveTextEntrance text="for the Present" className="block" emoji="❌" delay={300} />
          </h2>
          <h2 className="font-orbitron text-3xl md:text-5xl lg:text-6xl font-semibold text-white mb-16 tracking-wide leading-tight">
            <WaveTextEntrance text="We Craft Experiences" className="block" delay={600} />
            <WaveTextEntrance text="for the Future" className="block" emoji="🔮" delay={900} />
          </h2>
          
          <ScrollReveal
            baseOpacity={0.1}
            baseRotation={3}
            enableBlur={true}
            blurStrength={4}
            textClassName="font-orbitron text-base md:text-lg text-white/70 font-light tracking-wide leading-relaxed"
            containerClassName="max-w-3xl"
          >
            Specializing in developing enterprise software, custom applications, and AI integrations, delivering innovative and scalable solutions that create real value for businesses across all digital platforms.
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
