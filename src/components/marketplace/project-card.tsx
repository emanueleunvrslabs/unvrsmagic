"use client";

import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import "./project-card.css";

interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  route: string;
}

interface ProjectCardProps {
  project: Project;
  isAdded: boolean;
  onViewDetails: (project: Project) => void;
}

export function ProjectCard({ project, isAdded, onViewDetails }: ProjectCardProps) {
  return (
    <div className="marketplace-project-card group">
      {isAdded && (
        <div className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md bg-green-500/20 border border-green-500/40 shadow-[inset_0_0_20px_rgba(34,197,94,0.2),0_0_20px_rgba(34,197,94,0.3)]">
          <Check className="h-4 w-4 text-green-500" />
        </div>
      )}
      
      <div className="card-main-content items-center justify-center">
        <div className="card-heading text-4xl text-center">
          {project.name}
        </div>
        
        <p className="text-white/60 text-xs mt-2 max-w-[280px] leading-relaxed text-center line-clamp-3">
          {project.description || "No description available"}
        </p>
      </div>
      
      <button 
        onClick={() => onViewDetails(project)}
        className="absolute bottom-4 right-4 px-3 py-1.5 text-xs tracking-wide rounded-lg backdrop-blur-md bg-white/5 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.1),inset_0_0_5px_rgba(255,255,255,0.15),0_5px_5px_rgba(0,0,0,0.164)] transition-all hover:bg-white/10 hover:border-white/20"
        style={{ color: 'hsl(270, 70%, 60%)' }}
      >
        Details
      </button>
    </div>
  );
}
