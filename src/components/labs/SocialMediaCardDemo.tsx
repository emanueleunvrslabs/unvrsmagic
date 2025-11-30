import "./SocialMediaCard.css";
import { useState } from "react";
import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";

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
          <div className="flex flex-col justify-between p-8 h-full w-full max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Credit Balance</h2>
              </div>
              <button className="px-6 py-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 font-semibold hover:bg-blue-500/30 transition-all">
                + Add Credits
              </button>
            </div>
            
            <p className="text-gray-400 mb-8">Your available credits for content generation</p>
            
            <div className="mb-12">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-bold text-white">0,00 €</span>
                <span className="text-xl text-gray-400">available</span>
              </div>
            </div>
            
            <div className="flex gap-16">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-gray-400 text-sm">Purchased</p>
                  <p className="text-2xl font-semibold text-white">0,00 €</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <TrendingDown className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-gray-400 text-sm">Spent</p>
                  <p className="text-2xl font-semibold text-white">0,00 €</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
