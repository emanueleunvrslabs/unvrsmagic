import { WaveTextEntrance } from "./WaveTextEntrance";

interface ShinyTextProps {
  text: string;
  speed?: number;
  className?: string;
}

const ShinyText = ({ text, speed = 5, className = "" }: ShinyTextProps) => {
  return (
    <span
      className={`inline bg-clip-text ${className}`}
      style={{
        backgroundImage: `linear-gradient(
          120deg,
          rgba(255, 255, 255, 0.5) 0%,
          rgba(255, 255, 255, 0.5) 40%,
          rgba(255, 255, 255, 1) 50%,
          rgba(255, 255, 255, 0.5) 60%,
          rgba(255, 255, 255, 0.5) 100%
        )`,
        backgroundSize: "200% 100%",
        animation: `shiny-text-claim ${speed}s linear infinite`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      <style>{`
        @keyframes shiny-text-claim {
          0% {
            background-position: 200% 50%;
          }
          100% {
            background-position: -200% 50%;
          }
        }
      `}</style>
      {text}
    </span>
  );
};

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
          
          <div className="max-w-3xl">
            <p className="font-orbitron text-base md:text-lg font-light tracking-wide leading-relaxed">
            <ShinyText 
                text="Specializing in developing enterprise software, custom applications, and AI integrations, delivering innovative and scalable solutions that create real value for businesses across all digital platforms."
                speed={3}
              />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
