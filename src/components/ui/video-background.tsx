import { useEffect, useState } from "react";

export function VideoBackground() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      setOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0f]">
      {/* Animated gradient orbs that follow mouse */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 transition-transform duration-1000 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 70%)",
          left: "10%",
          top: "10%",
          transform: `translate(${offset.x * 0.5}px, ${offset.y * 0.5}px)`,
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 transition-transform duration-1000 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(168,85,247,0) 70%)",
          right: "5%",
          top: "30%",
          transform: `translate(${-offset.x * 0.3}px, ${offset.y * 0.3}px)`,
        }}
      />
      <div
        className="absolute w-[700px] h-[700px] rounded-full opacity-20 transition-transform duration-1000 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0) 70%)",
          left: "30%",
          bottom: "-10%",
          transform: `translate(${offset.x * 0.4}px, ${-offset.y * 0.4}px)`,
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 transition-transform duration-1000 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(236,72,153,0) 70%)",
          right: "20%",
          bottom: "10%",
          transform: `translate(${-offset.x * 0.6}px, ${-offset.y * 0.6}px)`,
        }}
      />

      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid pattern for depth */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
