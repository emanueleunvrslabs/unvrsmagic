import { useEffect, useRef, useState } from "react";

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("loadeddata", () => {
      setIsLoaded(true);
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-30" : "opacity-0"
        }`}
        style={{
          filter: "brightness(0.4) contrast(1.2) saturate(1.3)",
        }}
      >
        {/* Placeholder: Add your actual demo reel video URL here */}
        <source
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          type="video/mp4"
        />
      </video>

      {/* Gradient Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)",
        }}
      />
      
      {/* Radial overlay to keep focus on center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Green tint overlay for brand consistency */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(55, 255, 139, 0.03)",
          mixBlendMode: "screen",
        }}
      />

      {/* Animated scan lines effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(55, 255, 139, 0.03) 2px, rgba(55, 255, 139, 0.03) 4px)",
          animation: "scan 8s linear infinite",
        }}
      />

      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(50px);
          }
        }
      `}</style>
    </div>
  );
}
