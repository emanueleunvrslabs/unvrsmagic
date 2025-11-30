import "./SocialMediaCard.css";
import { Image, Video, Sparkles, Sliders, Calendar, Share2, Plus } from "lucide-react";

export function SocialMediaCardDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="social-media-card labs-card group overflow-y-auto">
        <div className="card-main-content items-start justify-start gap-6 p-6" style={{ width: '100%', flexDirection: 'row' }}>
          {/* What's Included Card - Left */}
          <div className="flex-1 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.1),inset_0_0_5px_rgba(255,255,255,0.15),0_5px_5px_rgba(0,0,0,0.164)]">
            <h2 className="text-2xl font-semibold mb-4 text-white">What's Included</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Image className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/90 text-sm">Professional Image Generation with Nano Banana 2</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/90 text-sm">High-Quality Video Creation with Veo 3.1 Fast</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/90 text-sm">Multiple Generation Modes (Text-to-Image, Image-to-Image, Text-to-Video)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Sliders className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/90 text-sm">Advanced Aspect Ratio & Resolution Controls</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/90 text-sm">First/Last Frame Video Generation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/90 text-sm">Reference-Based Video Creation</span>
              </div>
            </div>
          </div>

          {/* Pricing Card - Right */}
          <div className="flex-1 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.1),inset_0_0_5px_rgba(255,255,255,0.15),0_5px_5px_rgba(0,0,0,0.164)]">
            <h2 className="text-2xl font-semibold mb-4 text-white">Pricing</h2>
            <div className="flex flex-col gap-4">
              {/* Image Pricing Card */}
              <div className="relative p-4 rounded-2xl border-2 border-blue-500/50 bg-blue-500/10 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                      <Image className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-xl font-semibold text-white">Image</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">€1.00</div>
                    <div className="text-sm text-white/60">per image</div>
                  </div>
                </div>
                <p className="text-sm text-white/70">Professional AI-generated images with Nano Banana 2</p>
              </div>

              {/* Video Pricing Card */}
              <div className="relative p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Video className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-xl font-semibold text-white">Video</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">€10.00</div>
                    <div className="text-sm text-white/60">per video</div>
                  </div>
                </div>
                <p className="text-sm text-white/70">High-quality AI-generated videos with Veo 3.1 Fast</p>
              </div>

              {/* Add to Dashboard Button */}
              <button className="w-full py-3 px-4 rounded-xl bg-blue-600/20 border border-blue-500/30 backdrop-blur-sm text-blue-400 font-medium flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors">
                <Plus className="w-5 h-5" />
                Add to Dashboard
              </button>

              {/* Usage-Based Billing Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-700/30 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-amber-300 mb-2">Usage-Based Billing</h3>
                <p className="text-sm text-amber-100/70">
                  You only pay for what you generate. Costs are calculated based on actual content created through the AI models.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
