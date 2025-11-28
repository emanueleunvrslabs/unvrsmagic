import { useEffect, useState } from "react";
import element1 from "@/assets/landing/3d-element-1.png";
import element2 from "@/assets/landing/3d-element-2.png";
import element3 from "@/assets/landing/3d-element-3.png";
import element4 from "@/assets/landing/3d-element-4.png";
import element5 from "@/assets/landing/3d-element-5.png";
import element6 from "@/assets/landing/3d-element-6.png";

const floatingElements = [
  { src: element1, position: "top-20 left-32", delay: "0s" },
  { src: element2, position: "top-40 right-32", delay: "0.5s" },
  { src: element3, position: "top-1/3 left-20", delay: "1s" },
  { src: element4, position: "bottom-1/3 right-24", delay: "1.5s" },
  { src: element5, position: "bottom-40 left-40", delay: "2s" },
  { src: element6, position: "bottom-32 right-40", delay: "2.5s" },
];

export function LandingHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Floating 3D Elements */}
      {floatingElements.map((element, index) => (
        <div
          key={index}
          className={`absolute ${element.position} w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 opacity-70 animate-float`}
          style={{
            animationDelay: element.delay,
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.02}px, ${(mousePosition.y - window.innerHeight / 2) * 0.02}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          <img
            src={element.src}
            alt=""
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      ))}

      {/* Main Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-[10vw] md:text-[12vw] lg:text-[15vw] font-black tracking-[0.2em] text-white mb-8 leading-none">
          UNVRS
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-white/80 max-w-3xl mx-auto font-light tracking-wide leading-relaxed">
          Beyond code, we build universes<br />where businesses and AI<br />evolve together.
        </p>
      </div>
    </section>
  );
}
