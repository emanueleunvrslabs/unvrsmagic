export function LandingLearnMore() {
  return (
    <section id="learn-more" className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <h2 
            className="text-4xl md:text-6xl font-light text-white mb-8 leading-tight"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            <div className="mb-4 flex flex-wrap gap-x-4">
              <span>We</span>
              <span>Don't</span>
              <span>Just</span>
              <span>Design</span>
              <span>for</span>
              <span>the</span>
              <span>Present</span>
              <span>❌</span>
            </div>
            <div className="flex flex-wrap gap-x-4">
              <span className="text-white/90">We</span>
              <span className="text-white/90">Craft</span>
              <span className="text-white/90">Experiences</span>
              <span className="text-white/90">for</span>
              <span className="text-white/90">the</span>
              <span className="text-white/90">Future</span>
              <span>🔮</span>
            </div>
          </h2>

          <p 
            className="text-white/70 text-lg md:text-xl leading-relaxed" 
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Specializing in developing enterprise software, custom applications, and AI integrations, delivering innovative and scalable solutions that create real value for businesses across all digital platforms.
          </p>
        </div>
      </div>
    </section>
  );
}
