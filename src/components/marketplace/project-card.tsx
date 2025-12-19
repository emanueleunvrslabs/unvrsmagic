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
        <div className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
          <Check className="h-4 w-4 text-green-400" />
        </div>
      )}
      
      <div className="card-main-content items-center justify-center">
        <div className="card-heading text-center">
          {project.name}
        </div>
        
        <p className="text-white/50 text-sm max-w-[280px] leading-relaxed text-center line-clamp-3 font-normal">
          {project.description || "No description available"}
        </p>
      </div>
      
      <button 
        onClick={() => onViewDetails(project)}
        className="absolute bottom-4 right-4 px-4 py-2.5 text-sm font-medium rounded-xl liquid-glass-card text-white/90 transition-all"
      >
        Details
      </button>
    </div>
  );
}
