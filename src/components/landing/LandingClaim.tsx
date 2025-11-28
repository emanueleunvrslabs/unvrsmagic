import { WaveText } from "./WaveText";

export function LandingClaim() {
  return (
    <section className="relative py-32 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl text-left">
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-light text-white mb-8 tracking-wide leading-tight">
            <WaveText text="We Don't Just Design" className="block" />
            <WaveText text="for the Present" className="block" emoji="❌" />
          </h2>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-light text-white mb-16 tracking-wide leading-tight">
            <WaveText text="We Craft Experiences" className="block" />
            <WaveText text="for the Future" className="block" emoji="🔮" />
          </h2>
          
          <p className="font-orbitron text-base md:text-lg text-white/70 font-light tracking-wide leading-relaxed max-w-3xl animate-fade-in [animation-delay:400ms]">
            Specializing in developing enterprise software, custom applications, and AI integrations,
            delivering innovative and scalable solutions that create real value for businesses across all digital platforms.
          </p>
        </div>
      </div>
    </section>
  );
}
