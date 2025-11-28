import { motion } from "framer-motion";

interface BrandCardProps {
  src: string;
  alt: string;
}

export function BrandCard({ src, alt }: BrandCardProps) {
  return (
    <div className="brand-card-container flex-shrink-0">
      <div className="brand-card">
        <img src={src} alt={alt} className="brand-logo" />
      </div>
      <style>{`
        .brand-card-container {
          padding: 1rem;
        }

        .brand-card {
          position: relative;
          width: 20vmin;
          height: 20vmin;
          background: linear-gradient(135deg, #1e1e24 10%, #050505 60%);
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          animation: gradient-shift 5s ease-in-out infinite;
          background-size: 200% 200%;
        }

        .brand-card .brand-logo {
          width: 90%;
          height: 90%;
          object-fit: contain;
          user-select: none;
        }

        .brand-card::before,
        .brand-card::after {
          --size: 5px;
          content: "";
          position: absolute;
          top: calc(var(--size) / -2);
          left: calc(var(--size) / -2);
          width: calc(100% + var(--size));
          height: calc(100% + var(--size));
          background: radial-gradient(circle at 0 0, hsl(27deg 93% 60%), transparent),
            radial-gradient(circle at 100% 0, #00a6ff, transparent),
            radial-gradient(circle at 0 100%, #ff0056, transparent),
            radial-gradient(circle at 100% 100%, #6500ff, transparent);
        }

        .brand-card::after {
          --size: 2px;
          z-index: -1;
        }

        .brand-card::before {
          --size: 10px;
          z-index: -2;
          filter: blur(2vmin);
          animation: blur-animation 3s ease-in-out alternate infinite;
        }

        @keyframes blur-animation {
          to {
            filter: blur(3vmin);
            transform: scale(1.05);
          }
        }

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
