import { useState } from "react";
import { X, Minimize2, Maximize2 } from "lucide-react";
import "./Window.css";

export function Window() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div className={`window-container ${isMaximized ? 'maximized' : ''} ${isMinimized ? 'minimized' : ''}`}>
      {/* Window Header */}
      <div className="window-header">
        <div className="window-title">Window</div>
        <div className="window-controls">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="window-control-btn"
            aria-label="Minimize"
          >
            <Minimize2 size={14} />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="window-control-btn"
            aria-label="Maximize"
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="window-control-btn window-close-btn"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Window Content */}
      {!isMinimized && (
        <div className="window-content">
          <h2 className="window-content-title">Welcome to Labs</h2>
          <p className="window-content-text">
            This is an experimental window component with glassmorphism effects.
          </p>
          <p className="window-content-text">
            Try minimizing, maximizing, or exploring the animated stars in the background.
          </p>
        </div>
      )}
    </div>
  );
}
