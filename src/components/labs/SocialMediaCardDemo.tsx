import "./SocialMediaCard.css";
import { useState } from "react";

export function SocialMediaCardDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div 
        className="flex items-center gap-6 p-6 rounded-lg border bg-card/50 backdrop-blur-md shadow-lg max-w-2xl w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src="https://uiverse.io/astronaut.png"
          alt="Astronaut"
          className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1">
          {/* Content can be added here */}
        </div>
      </div>
    </div>
  );
}
