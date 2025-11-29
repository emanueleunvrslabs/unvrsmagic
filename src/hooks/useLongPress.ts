import { useRef, useCallback, useState } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onClick, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const [isPressed, setIsPressed] = useState(false);

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isLongPress.current = false;
    setIsPressed(true);
    
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      setIsPressed(false);
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If it wasn't a long press and onClick is defined, call it
    if (!isLongPress.current && onClick) {
      onClick();
    }
    
    isLongPress.current = false;
    setIsPressed(false);
  }, [onClick]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isLongPress.current = false;
    setIsPressed(false);
  }, []);

  return {
    handlers: {
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: clear,
    },
    isPressed,
  };
}
