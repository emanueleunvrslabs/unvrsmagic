import { useEffect, useState } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let trailId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Add trail point
      setTrail((prev) => {
        const newTrail = [
          ...prev,
          { x: e.clientX, y: e.clientY, id: trailId++ },
        ];
        return newTrail.slice(-15); // Keep last 15 points
      });

      // Check if hovering over interactive element
      const target = e.target as HTMLElement;
      const isInteractive = target.closest("a, button, [role='button']");
      setIsHovering(!!isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Trail */}
      {trail.map((point, index) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-50 rounded-full"
          style={{
            left: point.x,
            top: point.y,
            width: 8,
            height: 8,
            background: `rgba(55, 255, 139, ${0.5 - index * 0.03})`,
            transform: "translate(-50%, -50%)",
            transition: "opacity 0.3s ease-out",
          }}
        />
      ))}

      {/* Main cursor */}
      <div
        className="fixed pointer-events-none z-50 rounded-full transition-all duration-200"
        style={{
          left: position.x,
          top: position.y,
          width: isHovering ? 40 : 20,
          height: isHovering ? 40 : 20,
          border: "2px solid rgba(55, 255, 139, 0.8)",
          transform: "translate(-50%, -50%)",
          boxShadow: isHovering
            ? "0 0 20px rgba(55, 255, 139, 0.6)"
            : "0 0 10px rgba(55, 255, 139, 0.4)",
        }}
      />
    </>
  );
}
