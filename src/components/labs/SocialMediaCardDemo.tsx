import "./SocialMediaCard.css";
import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";

export function SocialMediaCardDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-5xl p-8 rounded-3xl border border-white/10 bg-background/50 backdrop-blur-xl relative overflow-hidden">
        {/* Stars effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-1 h-1 rounded-full opacity-0 animate-[glowing-stars_1.5s_linear_alternate_infinite]"
               style={{
                 boxShadow: '140px 20px #fff, 425px 20px #fff, 70px 120px #fff, 20px 130px #fff, 110px 80px #fff, 280px 80px #fff, 250px 350px #fff'
               }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">Credit Balance</h2>
          </div>
          <button className="px-6 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-600/30 transition-colors">
            + Add Credits
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-white/60 text-lg mb-8 relative z-10">
          Your available credits for content generation
        </p>

        {/* Balance Display */}
        <div className="flex items-baseline gap-3 mb-12 relative z-10">
          <span className="text-7xl font-bold text-white">0,00 €</span>
          <span className="text-2xl text-white/60">available</span>
        </div>

        {/* Stats */}
        <div className="flex gap-16 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-white/60 text-sm">Purchased</div>
              <div className="text-xl font-semibold text-white">0,00 €</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-white/60 text-sm">Spent</div>
              <div className="text-xl font-semibold text-white">0,00 €</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
