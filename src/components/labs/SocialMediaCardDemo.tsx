import "./SocialMediaCard.css";
import { useState } from "react";

export function SocialMediaCardDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div 
        className={`social-media-card ${isOpen ? 'expanded' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src="https://uiverse.io/astronaut.png"
          alt="Astronaut"
          className="astronaut-image"
        />
      </div>
    </div>
  );
}
