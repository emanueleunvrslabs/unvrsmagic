import "./SocialMediaCard.css";

export function SocialMediaCardDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="social-media-card group">
        <div className="card-main-content">
          <div className="card-heading text-4xl">
            AI SOCIAL
          </div>
          
          <p className="text-white/60 text-xs mt-2 max-w-[280px] leading-relaxed">
            Platform for creating and scheduling AI visual content for social media with automatic image and video generation
          </p>
          
          <div className="social-icons">
            <div className="text-sm tracking-wide" style={{ color: 'hsl(270, 70%, 60%)' }}>
              Details
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
