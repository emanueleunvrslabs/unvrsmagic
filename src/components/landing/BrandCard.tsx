interface BrandCardProps {
  name: string;
  logoType: string;
}

const logos: Record<string, JSX.Element> = {
  hexagon: (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-10 md:h-10">
      <path d="M20 2L37 12V28L20 38L3 28V12L20 2Z" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="6" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  triangle: (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-10 md:h-10">
      <path d="M20 4L36 34H4L20 4Z" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M20 14L28 28H12L20 14Z" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  circle: (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-10 md:h-10">
      <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="4" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  diamond: (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-10 md:h-10">
      <path d="M20 2L38 20L20 38L2 20L20 2Z" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M20 10L30 20L20 30L10 20L20 10Z" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  star: (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-10 md:h-10">
      <path d="M20 2L24 14L36 14L26 22L30 34L20 26L10 34L14 22L4 14L16 14L20 2Z" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  octagon: (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-10 md:h-10">
      <path d="M12 2H28L38 12V28L28 38H12L2 28V12L12 2Z" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  square: (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-10 md:h-10">
      <rect x="4" y="4" width="32" height="32" stroke="white" strokeWidth="2" fill="none"/>
      <rect x="12" y="12" width="16" height="16" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  pentagon: (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-10 md:h-10">
      <path d="M20 2L38 14L30 36H10L2 14L20 2Z" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M20 12L30 20L26 32H14L10 20L20 12Z" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
};

export function BrandCard({ name, logoType }: BrandCardProps) {
  return (
    <div className="brand-card-container flex-shrink-0">
      <div className="brand-card">
        <div className="brand-logo-icon">
          {logos[logoType] || logos.hexagon}
        </div>
        <div className="brand-name">{name}</div>
      </div>
      <style>{`
        .brand-card-container {
          padding: 1rem;
        }

        .brand-card {
          position: relative;
          width: 140px;
          height: 140px;
          background: linear-gradient(135deg, #1e1e24 10%, #050505 60%);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          user-select: none;
          animation: gradient-shift 5s ease-in-out infinite;
          background-size: 200% 200%;
          border-radius: 1rem;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        @media (min-width: 768px) {
          .brand-card {
            width: 20vmin;
            height: 20vmin;
          }
        }

        .brand-card:hover {
          transform: translate(-6px, -6px) rotate(1deg);
        }

        .brand-card .brand-logo-icon {
          opacity: 0.8;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          z-index: 3;
        }

        .brand-card:hover .brand-logo-icon {
          transform: translateY(-10px);
          opacity: 1;
        }

        .brand-card:hover .brand-logo-icon svg {
          animation: spin-and-zoom 4s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
        }

        .brand-card .brand-name {
          font-size: 16px;
          font-weight: 700;
          color: white;
          background-image: linear-gradient(to right, #626262, #fff);
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          user-select: none;
          text-align: center;
          font-family: "Orbitron", sans-serif;
          letter-spacing: 0.1em;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          z-index: 3;
        }

        .brand-card:hover .brand-name {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        @media (min-width: 768px) {
          .brand-card .brand-name {
            font-size: 3vmin;
          }
        }

        .brand-card:active .brand-logo-icon,
        .brand-card:active .brand-name {
          transform: scale(0.95);
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
          border-radius: 1rem;
          transition: 0.6s;
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

        .brand-card:hover::before {
          animation: swipeRight 1.5s infinite, blur-animation 3s ease-in-out alternate infinite;
          left: -100%;
        }

        @keyframes swipeRight {
          100% {
            transform: translateX(200%) skew(-45deg);
          }
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

        @keyframes spin-and-zoom {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.1);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
