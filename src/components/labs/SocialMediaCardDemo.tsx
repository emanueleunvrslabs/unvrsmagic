import "./SocialMediaCard.css";
import { Briefcase, FileText, StickyNote, Settings, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";

export function SocialMediaCardDemo() {
  const [isOpen, setIsOpen] = useState(false);
  
  const contacts = [
    { id: "1", name: "Mario Rossi", email: "mario@example.com", phone: "+39 123 456 789" },
    { id: "2", name: "Laura Bianchi", email: "laura@example.com", phone: "+39 987 654 321" }
  ];

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div 
        className={`social-media-card ${isOpen ? 'expanded' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src="https://uiverse.io/astronaut.png"
          alt="Astronaut"
          className="astronaut-image"
        />
        <div className="social-icons">
          <a href="#" className="instagram-link" onClick={(e) => e.stopPropagation()}>
            <Briefcase className="icon" strokeWidth={2} />
          </a>
          <a href="#" className="x-link" onClick={(e) => e.stopPropagation()}>
            <FileText className="icon" strokeWidth={2} />
          </a>
          <a href="#" className="discord-link" onClick={(e) => e.stopPropagation()}>
            <StickyNote className="icon" strokeWidth={2} />
          </a>
          <a href="#" className="fourth-link" onClick={(e) => e.stopPropagation()}>
            <Settings className="icon" strokeWidth={2} />
          </a>
        </div>

        {/* Collapsible Contacts Section */}
        <div className={`contacts-section ${isOpen ? 'open' : ''}`}>
          {contacts.map((contact) => (
            <div key={contact.id} className="contact-item-card">
              <span className="contact-name-card">{contact.name}</span>
              <div className="contact-actions-card">
                <button
                  className="contact-btn-card"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Email:', contact.email);
                  }}
                  aria-label="Send email"
                >
                  <Mail className="contact-icon-card" size={18} />
                </button>
                <button
                  className="contact-btn-card"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('WhatsApp:', contact.phone);
                  }}
                  aria-label="Send WhatsApp"
                >
                  <MessageCircle className="contact-icon-card" size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
