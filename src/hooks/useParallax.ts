import { useEffect, useState, useRef } from "react";

export const useParallax = (speed = 0.5) => {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const windowHeight = window.innerHeight;
      
      // Calculate parallax offset when element is in viewport
      if (scrolled + windowHeight > elementTop && scrolled < elementTop + rect.height) {
        const relativeScroll = scrolled - elementTop + windowHeight;
        setOffset(relativeScroll * speed);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return { ref, offset };
};
