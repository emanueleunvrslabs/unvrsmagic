import { FC, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ShapeBlurProps {
  children: React.ReactNode;
  className?: string;
  variation?: number;
  shapeSize?: number;
  roundness?: number;
  borderSize?: number;
  circleSize?: number;
  circleEdge?: number;
  pixelRatioProp?: number;
}

export const ShapeBlur: FC<ShapeBlurProps> = ({
  children,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 50, y: 50 });
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated gradient blur background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(0, 200, 230, 0.3) 0%, rgba(120, 0, 200, 0.2) 40%, transparent 70%)`,
        }}
        transition={{ type: "tween", duration: 0.15, ease: "linear" }}
        style={{ filter: 'blur(40px)' }}
      />
      
      {/* Animated moving gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-50"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 30%, rgba(0, 200, 230, 0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 80% 70%, rgba(120, 0, 200, 0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 50%, rgba(0, 200, 230, 0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 20% 30%, rgba(0, 200, 230, 0.2) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ filter: 'blur(60px)' }}
      />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
