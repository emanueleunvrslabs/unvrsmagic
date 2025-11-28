interface WaveTextProps {
  text: string;
  className?: string;
  emoji?: string;
}

export function WaveText({ text, className = "", emoji }: WaveTextProps) {
  const words = text.split(" ");
  
  return (
    <span className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          {word.split("").map((char, charIndex) => {
            const globalIndex = words.slice(0, wordIndex).join("").length + wordIndex + charIndex;
            return (
              <span
                key={charIndex}
                className="inline-block animate-wave"
                style={{
                  animationDelay: `${globalIndex * 0.05}s`,
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
        <span className="inline-block ml-2">{emoji}</span>
      )}
    </span>
  );
}
