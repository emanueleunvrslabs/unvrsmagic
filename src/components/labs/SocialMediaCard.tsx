import "./SocialMediaCard.css";
import { Briefcase, FileText, StickyNote, Settings } from "lucide-react";

interface SocialMediaCardProps {
  companyName?: string;
}

export const SocialMediaCard = ({ companyName = "Company Name S.r.l." }: SocialMediaCardProps) => {
  return (
    <div className="social-media-card">
      <img
        src="https://uiverse.io/astronaut.png"
        alt="Astronaut"
        className="astronaut-image"
      />
      <div className="card-heading">{companyName}</div>
      <div className="social-icons">
        <a href="#" className="instagram-link">
          <Briefcase className="icon" strokeWidth={2} />
        </a>
        <a href="#" className="x-link">
          <FileText className="icon" strokeWidth={2} />
        </a>
        <a href="#" className="discord-link">
          <StickyNote className="icon" strokeWidth={2} />
        </a>
        <a href="#" className="fourth-link">
          <Settings className="icon" strokeWidth={2} />
        </a>
      </div>
    </div>
  );
};
