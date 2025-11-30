import { Mail, MessageCircle, Pencil } from "lucide-react";
import "./SocialMediaCard.css";

export function SocialMediaCardDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="social-media-card group">
        <div className="card-main-content">
          <div className="card-heading">
            UNVRS LABS
          </div>
          
          <div className="social-icons">
            <button className="instagram-link">
              <Mail className="icon" strokeWidth={2} />
            </button>
            <button className="x-link">
              <MessageCircle className="icon" strokeWidth={2} />
            </button>
            <button className="discord-link">
              <Pencil className="icon" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
