import { useState } from "react";

interface CyberCardProps {
  title: string;
  description: string;
  delay?: number;
}

export function CyberCard({ title, description, delay = 0 }: CyberCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative w-full h-[340px] transition-all duration-200 select-none"
      style={{ 
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 z-[200] grid grid-cols-5 grid-rows-5 perspective-[800px]">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="tracker"
            style={{
              gridArea: `tr-${i + 1}`,
            }}
          />
        ))}
        
        <div 
          id={`card-${title}`}
          className="absolute inset-0 flex justify-center items-center rounded-[20px] transition-all duration-700 bg-gradient-to-br from-[#1a1a1a] to-[#262626] border-2 border-white/10 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(0,0,0,0.2)]"
          style={{
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
          }}
        >
          {/* Glare Effect */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: 'linear-gradient(125deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0) 100%)',
              opacity: isHovered ? 1 : 0,
            }}
          />

          {/* Cyber Lines */}
          <div className="cyber-lines">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-[rgba(92,103,255,0.2)] to-transparent"
                style={{
                  top: `${20 + i * 20}%`,
                  left: i % 2 === 0 ? 0 : 'auto',
                  right: i % 2 === 1 ? 0 : 'auto',
                  transform: 'scaleX(0)',
                  transformOrigin: i % 2 === 0 ? 'left' : 'right',
                  animation: `lineGrow 3s linear infinite ${i * 0.5}s`,
                }}
              />
            ))}
          </div>

          <div className="relative w-full h-full">
            {/* Glowing Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {[
                { top: '-20px', left: '-20px' },
                { top: '50%', right: '-30px', transform: 'translateY(-50%)' },
                { bottom: '-20px', left: '30%' }
              ].map((pos, i) => (
                <div
                  key={i}
                  className="absolute w-[100px] h-[100px] rounded-full transition-opacity duration-300"
                  style={{
                    ...pos,
                    background: 'radial-gradient(circle at center, rgba(0,255,170,0.3) 0%, rgba(0,255,170,0) 70%)',
                    filter: 'blur(15px)',
                    opacity: isHovered ? 1 : 0,
                  }}
                />
              ))}
            </div>

            {/* Title */}
            <div
              className="absolute w-full text-center px-6 pt-8 text-3xl font-extrabold tracking-[4px] transition-all duration-300"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                background: 'linear-gradient(45deg, #00ffaa, #00a2ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 15px rgba(0,255,170,0.3))',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              {title}
            </div>

            {/* Hover Prompt */}
            <p
              className="absolute left-1/2 -translate-x-1/2 z-20 text-base font-semibold tracking-[2px] text-center transition-all duration-300"
              style={{
                bottom: '140px',
                fontFamily: 'Orbitron, sans-serif',
                color: 'rgba(255,255,255,0.7)',
                textShadow: '0 0 10px rgba(255,255,255,0.3)',
                opacity: isHovered ? 0 : 1,
              }}
            >
              HOVER ME
            </p>

            {/* Description */}
            <div
              className="absolute bottom-12 w-full text-center px-6 text-xs tracking-[2px] transition-all duration-300"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                color: 'rgba(255,255,255,0.6)',
                transform: isHovered ? 'translateY(0)' : 'translateY(30px)',
                opacity: isHovered ? 1 : 0,
              }}
            >
              <span>{description}</span>
            </div>

            {/* Particles */}
            <div className="card-particles">
              {[
                { x: 1, y: -1, top: '40%', left: '20%' },
                { x: -1, y: -1, top: '60%', right: '20%' },
                { x: 0.5, y: 1, top: '20%', left: '40%' },
                { x: -0.5, y: 1, top: '80%', right: '40%' },
                { x: 1, y: 0.5, top: '30%', left: '60%' },
                { x: -1, y: 0.5, top: '70%', right: '60%' }
              ].map((particle, i) => (
                <span
                  key={i}
                  className="absolute w-[3px] h-[3px] bg-[#00ffaa] rounded-full transition-opacity duration-300"
                  style={{
                    top: particle.top,
                    left: particle.left,
                    right: particle.right,
                    opacity: isHovered ? 1 : 0,
                    animation: isHovered ? 'particleFloat 2s infinite' : 'none',
                    animationDelay: `${i * 0.1}s`,
                    '--x': particle.x,
                    '--y': particle.y,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Corner Elements */}
            <div className="corner-elements">
              {[
                { top: '10px', left: '10px', borderRight: 0, borderBottom: 0 },
                { top: '10px', right: '10px', borderLeft: 0, borderBottom: 0 },
                { bottom: '10px', left: '10px', borderRight: 0, borderTop: 0 },
                { bottom: '10px', right: '10px', borderLeft: 0, borderTop: 0 }
              ].map((corner, i) => (
                <span
                  key={i}
                  className="absolute w-[15px] h-[15px] transition-all duration-300"
                  style={{
                    ...corner,
                    border: `2px solid ${isHovered ? 'rgba(92,103,255,0.8)' : 'rgba(92,103,255,0.3)'}`,
                    boxShadow: isHovered ? '0 0 10px rgba(92,103,255,0.5)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Scan Line */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, transparent, rgba(92,103,255,0.1), transparent)',
                transform: 'translateY(-100%)',
                animation: 'scanMove 2s linear infinite',
              }}
            />
          </div>

          {/* Radial Glow Behind */}
          <div
            className="absolute left-1/2 top-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at center, rgba(0,255,170,0.1) 0%, rgba(0,162,255,0.05) 50%, transparent 100%)',
              filter: 'blur(20px)',
              opacity: isHovered ? 1 : 0,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes lineGrow {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(0); opacity: 0; }
        }

        @keyframes scanMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes particleFloat {
          0% { transform: translate(0, 0); opacity: 0; }
          50% { opacity: 1; }
          100% { 
            transform: translate(calc(var(--x) * 30px), calc(var(--y) * 30px)); 
            opacity: 0; 
          }
        }

        .tracker {
          position: relative;
          z-index: 200;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .tracker:hover ~ #card-${title.replace(/\s/g, '-')} {
          transition: 125ms ease-in-out;
        }

        /* 3D rotations for each tracker position */
        .tracker:nth-child(1):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(20deg) rotateY(-10deg); }
        .tracker:nth-child(2):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(20deg) rotateY(-5deg); }
        .tracker:nth-child(3):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(20deg) rotateY(0deg); }
        .tracker:nth-child(4):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(20deg) rotateY(5deg); }
        .tracker:nth-child(5):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(20deg) rotateY(10deg); }
        
        .tracker:nth-child(6):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(10deg) rotateY(-10deg); }
        .tracker:nth-child(7):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(10deg) rotateY(-5deg); }
        .tracker:nth-child(8):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(10deg) rotateY(0deg); }
        .tracker:nth-child(9):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(10deg) rotateY(5deg); }
        .tracker:nth-child(10):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(10deg) rotateY(10deg); }
        
        .tracker:nth-child(11):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(0deg) rotateY(-10deg); }
        .tracker:nth-child(12):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(0deg) rotateY(-5deg); }
        .tracker:nth-child(13):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(0deg) rotateY(0deg); }
        .tracker:nth-child(14):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(0deg) rotateY(5deg); }
        .tracker:nth-child(15):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(0deg) rotateY(10deg); }
        
        .tracker:nth-child(16):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-10deg) rotateY(-10deg); }
        .tracker:nth-child(17):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-10deg) rotateY(-5deg); }
        .tracker:nth-child(18):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-10deg) rotateY(0deg); }
        .tracker:nth-child(19):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-10deg) rotateY(5deg); }
        .tracker:nth-child(20):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-10deg) rotateY(10deg); }
        
        .tracker:nth-child(21):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-20deg) rotateY(-10deg); }
        .tracker:nth-child(22):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-20deg) rotateY(-5deg); }
        .tracker:nth-child(23):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-20deg) rotateY(0deg); }
        .tracker:nth-child(24):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-20deg) rotateY(5deg); }
        .tracker:nth-child(25):hover ~ #card-${title.replace(/\s/g, '-')} { transform: rotateX(-20deg) rotateY(10deg); }
      `}</style>
    </div>
  );
}
