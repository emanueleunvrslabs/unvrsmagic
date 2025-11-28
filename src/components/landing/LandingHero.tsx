import element1 from "@/assets/landing/3d-element-1.png";
import element2 from "@/assets/landing/3d-element-2.png";
import element3 from "@/assets/landing/3d-element-3.png";
import element4 from "@/assets/landing/3d-element-4.png";
import element5 from "@/assets/landing/3d-element-5.png";
import element6 from "@/assets/landing/3d-element-6.png";

const floatingElements = [
  { src: element1, position: "top-24 left-10", delay: "0s" },
  { src: element2, position: "top-40 right-8", delay: "0.5s" },
  { src: element3, position: "top-1/3 left-4", delay: "1s" },
  { src: element4, position: "bottom-1/3 right-6", delay: "1.5s" },
  { src: element5, position: "bottom-32 left-16", delay: "2s" },
  { src: element6, position: "bottom-16 right-20", delay: "2.5s" },
];

export function LandingHero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Floating 3D Elements */}
      {floatingElements.map((element, index) => (
        <div
          key={index}
          className={`pointer-events-none absolute ${element.position} w-24 h-24 md:w-40 md:h-40 lg:w-52 lg:h-52 opacity-80 animate-float`}
          style={{ animationDelay: element.delay }}
        >
          <img
            src={element.src}
            alt="UNVRS visual"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      ))}

      {/* Main Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-[18vw] md:text-[14vw] lg:text-[12vw] font-black tracking-[0.25em] text-white mb-10 leading-none">
          UNVRS
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-white/80 max-w-xl mx-auto font-light tracking-wide leading-relaxed animate-fade-in">
          Beyond code, we build universes
          <br />
          where businesses and AI
          <br />
          evolve together.
        </p>
      </div>
    </section>
  );
}
