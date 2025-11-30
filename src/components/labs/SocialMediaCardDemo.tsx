import "./SocialMediaCard.css";
import { useState } from "react";
import { Wallet } from "lucide-react";

export function SocialMediaCardDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div 
        className={`social-media-card ${isOpen ? 'expanded-lateral' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="card-main-content">
          <img
            src="https://uiverse.io/astronaut.png"
            alt="Astronaut"
            className="astronaut-image"
          />
        </div>
        
        {isOpen && (
          <div className="flex flex-col items-start justify-center gap-3 p-6 h-full">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Credit Balance</h2>
            </div>
            <p className="text-sm text-gray-300">Your available credits for content generation</p>
          </div>
        )}
      </div>
    </div>
  );
}
