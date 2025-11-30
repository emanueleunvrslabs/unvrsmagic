import "./SocialMediaCard.css";
import { useState } from "react";
import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import astronautFrontal from "@/assets/astronaut-frontal.png";

export function SocialMediaCardDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="social-media-card expanded-lateral">
        <div className="flex items-start justify-between w-full px-6 pt-6 pb-4 absolute top-0 left-0 right-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Credit Balance</h2>
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">Your available credits for content generation</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-blue-400 text-xs font-semibold hover:bg-white/10 transition-all">
            + Add Credits
          </button>
        </div>
        
        <div className="card-main-content">
          <img
            src={astronautFrontal}
            alt="Astronaut"
            className="astronaut-image"
          />
        </div>
        
        <div className="flex flex-col justify-center items-center p-8 pt-16 h-full w-full max-w-4xl">
          <div className="mb-12">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-bold text-white">0,00 €</span>
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
      </div>
    </div>
  );
}
