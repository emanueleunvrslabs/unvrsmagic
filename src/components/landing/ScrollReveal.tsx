import { useRef, useEffect, FC, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

export const ScrollReveal: FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
  textClassName = "",
  rotationEnd = "bottom bottom",
  wordAnimationEnd = "bottom bottom"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef?.current || window;

    // Container rotation animation
    gsap.fromTo(
      el,
      { rotateX: baseRotation },
      {
        rotateX: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          scroller,
          start: "top bottom",
          end: rotationEnd,
          scrub: true,
        },
      }
    );

    // Word animations
    const words = el.querySelectorAll('.scroll-reveal-word');
    
    words.forEach((word) => {
      gsap.fromTo(
        word,
        { 
          opacity: baseOpacity,
          filter: enableBlur ? `blur(${blurStrength}px)` : 'none'
        },
        {
          opacity: 1,
          filter: 'blur(0px)',
          ease: "none",
          scrollTrigger: {
            trigger: word,
            scroller,
            start: "top bottom",
            end: wordAnimationEnd,
            scrub: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [scrollContainerRef, enableBlur, baseOpacity, baseRotation, blurStrength, rotationEnd, wordAnimationEnd]);

  // Split text into words
  const renderContent = () => {
    if (typeof children === 'string') {
      const words = children.split(' ');
      return words.map((word, index) => (
        <span key={index}>
          <span 
            className="scroll-reveal-word inline-block"
            style={{ 
              opacity: baseOpacity,
              filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
              willChange: 'opacity, filter'
            }}
          >
            {word}
          </span>
          {index < words.length - 1 && ' '}
        </span>
      ));
    }
    return children;
  };

  return (
    <div 
      ref={containerRef} 
      className={`${containerClassName}`}
      style={{ perspective: '1000px' }}
    >
      <p className={textClassName}>
        {renderContent()}
      </p>
    </div>
  );
};
