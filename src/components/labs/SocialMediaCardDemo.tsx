import "./SocialMediaCard.css";

export function SocialMediaCardDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="social-media-card labs-card group">
        <div className="card-main-content items-center justify-center">
          <div className="card-heading text-4xl text-center">
            AI SOCIAL
          </div>
          
          <p className="text-white/60 text-xs mt-2 max-w-[280px] leading-relaxed text-center">
            Platform for creating and scheduling AI visual content for social media with automatic image and video generation
          </p>
        </div>
        
        <div className="absolute bottom-4 right-4 px-3 py-1.5 text-xs tracking-wide rounded-lg backdrop-blur-md bg-white/5 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.1),inset_0_0_5px_rgba(255,255,255,0.15),0_5px_5px_rgba(0,0,0,0.164)]" style={{ color: 'hsl(270, 70%, 60%)' }}>
          Details
        </div>
      </div>
    </div>
  );
}
