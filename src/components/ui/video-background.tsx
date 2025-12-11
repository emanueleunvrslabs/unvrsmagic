import { useEffect, useState } from "react";

export function VideoBackground() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scrollBlur, setScrollBlur] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setOffset({ x, y });
    };

    const handleScroll = () => {
      // Get the main scrollable container
      const scrollContainer = document.querySelector('main') || document.documentElement;
      const scrollTop = scrollContainer.scrollTop || window.scrollY;
      const maxScroll = 500; // Max scroll distance for full blur
      const maxBlur = 8; // Maximum blur in pixels
      const blur = Math.min((scrollTop / maxScroll) * maxBlur, maxBlur);
      setScrollBlur(blur);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, true);
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Video background with parallax and scroll blur */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute w-[110%] h-[110%] object-cover transition-all duration-300 ease-out"
        style={{
          left: "-5%",
          top: "-5%",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(1.05)`,
          filter: `blur(${scrollBlur}px)`,
        }}
      >
        <source
          src="https://amvbkkbqkzklrcynpwwm.supabase.co/storage/v1/object/public/uploads/9d8f65ef-58ef-47db-be8f-926f26411b39/1765494350764-4K_2.mp4"
          type="video/mp4"
        />
      </video>
      
      {/* Dark overlay for readability - also increases with scroll */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${0.4 + (scrollBlur / 8) * 0.2})`,
        }}
      />
      
      {/* Subtle blue/ice tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-800/40" />
    </div>
  );
}
