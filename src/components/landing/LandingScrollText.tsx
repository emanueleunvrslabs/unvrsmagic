import { ScrollVelocity } from "./ScrollVelocity";

export function LandingScrollText() {
  return (
    <section className="relative py-24 bg-black overflow-hidden">
      <ScrollVelocity
        texts={[
          "We don't build technology to replace humans.",
          "We build it to expand human intelligence."
        ]}
        velocity={15}
        className="font-orbitron text-3xl md:text-5xl lg:text-6xl font-semibold text-white/90 tracking-wide"
        numCopies={4}
        damping={50}
        stiffness={400}
      />
    </section>
  );
}
