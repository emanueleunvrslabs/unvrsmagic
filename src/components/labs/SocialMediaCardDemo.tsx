import "./SocialMediaCard.css";

export function SocialMediaCardDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="social-media-card group">
        <div className="card-main-content items-center justify-center">
          <div className="card-heading text-4xl text-center">
            AI SOCIAL
          </div>
          
          <p className="text-white/60 text-xs mt-2 max-w-[280px] leading-relaxed text-center">
            Platform for creating and scheduling AI visual content for social media with automatic image and video generation
          </p>
        </div>
        
        <div className="absolute bottom-4 right-4 text-[10px] tracking-wide" style={{ color: 'hsl(270, 70%, 60%)' }}>
          Details
        </div>
      </div>
    </div>
  );
}
