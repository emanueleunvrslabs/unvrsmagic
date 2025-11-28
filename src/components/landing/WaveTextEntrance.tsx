import { useEffect, useRef, useState } from "react";

interface WaveTextEntranceProps {
  text: string;
  className?: string;
  emoji?: string;
  delay?: number;
}

export function WaveTextEntrance({ text, className = "", emoji, delay = 0 }: WaveTextEntranceProps) {
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.2 }
    );

    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => {
      if (textRef.current) {
        observer.unobserve(textRef.current);
      }
    };
  }, [delay]);

  const words = text.split(" ");
  
  return (
    <span ref={textRef} className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          {word.split("").map((char, charIndex) => {
            const globalIndex = words.slice(0, wordIndex).join("").length + wordIndex + charIndex;
            return (
              <span
                key={charIndex}
                className={`inline-block transition-all duration-500 ${
                  isVisible 
                    ? 'opacity-100 translate-x-0 blur-0' 
                    : 'opacity-0 -translate-x-8 blur-sm'
                }`}
                style={{
                  transitionDelay: `${globalIndex * 30}ms`,
                }}
              >
                {char}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
      {emoji && (
        <span 
          className={`inline-block ml-2 transition-all duration-500 ${
            isVisible 
              ? 'opacity-100 scale-100 rotate-0 blur-0' 
              : 'opacity-0 scale-0 rotate-180 blur-sm'
          }`}
          style={{
            transitionDelay: `${text.length * 30}ms`,
          }}
        >
          {emoji}
        </span>
      )}
    </span>
  );
}
