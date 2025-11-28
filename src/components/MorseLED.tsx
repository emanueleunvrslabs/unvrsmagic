import { useEffect, useState } from "react";

const MORSE_CODE: Record<string, string> = {
  'L': '.-..', 'O': '---', 'V': '...-', 'E': '.',
  'I': '..', 'S': '...', 'T': '-', 'H': '....',
  'A': '.-', 'N': '-.', 'W': '.--', 'R': '.-.',
  ' ': '/'
};

const DOT_DURATION = 200;
const DASH_DURATION = DOT_DURATION * 3;
const SYMBOL_GAP = DOT_DURATION;
const LETTER_GAP = DOT_DURATION * 3;
const WORD_GAP = DOT_DURATION * 7;

export function MorseLED() {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    const message = "LOVE IS THE ANSWER";
    const morseSequence: { duration: number; isOn: boolean }[] = [];
    
    // Convert message to morse timing sequence
    for (let i = 0; i < message.length; i++) {
      const char = message[i];
      const morse = MORSE_CODE[char];
      
      if (morse === '/') {
        // Word gap
        morseSequence.push({ duration: WORD_GAP, isOn: false });
      } else if (morse) {
        // Process each symbol in the morse code
        for (let j = 0; j < morse.length; j++) {
          const symbol = morse[j];
          if (symbol === '.') {
            morseSequence.push({ duration: DOT_DURATION, isOn: true });
          } else if (symbol === '-') {
            morseSequence.push({ duration: DASH_DURATION, isOn: true });
          }
          
          // Add gap between symbols (except after last symbol)
          if (j < morse.length - 1) {
            morseSequence.push({ duration: SYMBOL_GAP, isOn: false });
          }
        }
        
        // Add gap between letters (except for spaces which handle it differently)
        if (i < message.length - 1 && message[i + 1] !== ' ') {
          morseSequence.push({ duration: LETTER_GAP, isOn: false });
        }
      }
    }
    
    // Play the morse sequence in a loop
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const playSequence = () => {
      if (currentIndex >= morseSequence.length) {
        // Reset and add a pause before repeating
        currentIndex = 0;
        timeoutId = setTimeout(() => {
          playSequence();
        }, WORD_GAP * 2);
        return;
      }
      
      const step = morseSequence[currentIndex];
      setIsActive(step.isOn);
      
      timeoutId = setTimeout(() => {
        currentIndex++;
        playSequence();
      }, step.duration);
    };
    
    playSequence();
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
  
  return (
    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
      <div className="absolute inset-0 bg-background rounded-full scale-110 -z-10" />
      <div 
        className={`w-5 h-5 rounded-full border-2 transition-all duration-75 ${
          isActive 
            ? 'bg-green-500 border-green-300 shadow-[0_0_12px_rgba(34,197,94,0.9)]' 
            : 'bg-green-500/20 border-green-700/50'
        }`}
      />
    </div>
  );
}
