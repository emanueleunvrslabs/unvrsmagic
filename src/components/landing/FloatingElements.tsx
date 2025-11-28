import { motion } from "framer-motion";

const elements = [
  {
    id: 1,
    symbol: "{",
    className: "text-6xl text-green-400/30 font-mono",
    x: "10%",
    y: "20%",
    duration: 8,
  },
  {
    id: 2,
    symbol: "}",
    className: "text-6xl text-green-400/30 font-mono",
    x: "85%",
    y: "25%",
    duration: 7,
  },
  {
    id: 3,
    symbol: "</>",
    className: "text-5xl text-green-400/25 font-mono",
    x: "15%",
    y: "60%",
    duration: 9,
  },
  {
    id: 4,
    symbol: "AI",
    className: "text-7xl text-green-400/20 font-bold",
    x: "80%",
    y: "70%",
    duration: 10,
  },
  {
    id: 5,
    symbol: "∞",
    className: "text-8xl text-green-400/15",
    x: "50%",
    y: "80%",
    duration: 12,
  },
];

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className={`absolute ${element.className}`}
          style={{
            left: element.x,
            top: element.y,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [-5, 5, -5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {element.symbol}
        </motion.div>
      ))}
    </div>
  );
}
