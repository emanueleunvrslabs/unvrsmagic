"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Check, Loader2, ExternalLink, Image, Video, Sparkles, Calendar, Share2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import "./project-details-modal.css";

interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  route: string;
}

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  isAdded: boolean;
  onAddProject: () => void;
  onRemoveProject: () => void;
  isLoading: boolean;
}

// Project-specific configurations
const projectConfigs: Record<string, {
  features: { icon: React.ElementType; text: string }[];
  pricing: { type: string; price: string; unit: string; description: string }[];
  category: string;
  description: string;
}> = {
  "ai-social": {
    features: [
      { icon: Image, text: "AI Image Generation with Nano Banana Pro" },
      { icon: Video, text: "AI Video Generation with Veo 3.1" },
      { icon: Sparkles, text: "Text-to-Image & Image-to-Image modes" },
      { icon: Bot, text: "Automated Workflow System" },
      { icon: Calendar, text: "Scheduled Content Publishing" },
      { icon: Share2, text: "Direct Social Publishing" },
    ],
    pricing: [
      { type: "Image", price: "€1.00", unit: "per image", description: "AI-generated images with Nano Banana Pro" },
      { type: "Video", price: "€10.00", unit: "per video", description: "AI-generated videos with Veo 3.1 (8s)" },
    ],
    category: "AI Content Creation",
    description: "Create stunning AI-generated images and videos, schedule posts, and publish directly to social media with automated workflows.",
  },
  "ai-art": {
    features: [
      { icon: Image, text: "Professional Image Generation with Nano Banana 2" },
      { icon: Video, text: "High-Quality Video Creation with Veo 3.1 Fast" },
      { icon: Sparkles, text: "Multiple Generation Modes (Text-to-Image, Image-to-Image, Text-to-Video)" },
      { icon: Bot, text: "Advanced Aspect Ratio & Resolution Controls" },
      { icon: Calendar, text: "First/Last Frame Video Generation" },
      { icon: Share2, text: "Reference-Based Video Creation" },
    ],
    pricing: [
      { type: "Image", price: "€1.00", unit: "per image", description: "Professional AI-generated images with Nano Banana 2" },
      { type: "Video", price: "€10.00", unit: "per video", description: "High-quality AI-generated videos with Veo 3.1 Fast" },
    ],
    category: "AI Art Generation",
    description: "Create professional AI-generated images and videos with advanced controls. Perfect for artists, designers, and content creators who need high-quality visual content.",
  },
  "dispacciamento": {
    features: [
      { icon: Bot, text: "7 AI Agents for Data Processing" },
      { icon: Sparkles, text: "Automated POD Analysis" },
      { icon: Calendar, text: "Monthly Dispatch Planning" },
      { icon: Share2, text: "Multi-Zone Support (7 Italian zones)" },
    ],
    pricing: [
      { type: "Processing", price: "Free", unit: "included", description: "All processing included in subscription" },
    ],
    category: "Energy Dispatch",
    description: "Italian energy dispatch system with AI-powered POD analysis and monthly profile generation for 7 Italian zones.",
  },
};

export function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  isAdded,
  onAddProject,
  onRemoveProject,
  isLoading,
}: ProjectDetailsModalProps) {
  if (!project) return null;

  // Get project-specific config or use defaults
  const routeKey = project.route.replace("/", "");
  const config = projectConfigs[routeKey] || {
    features: [
      { icon: Check, text: "Full access to project features" },
      { icon: Check, text: "Integration with your dashboard" },
      { icon: Check, text: "Real-time updates" },
    ],
    pricing: [
      { type: "Access", price: "Free", unit: "included", description: "Full access at no cost" },
    ],
    category: "Application",
    description: project.description || "No description available",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="project-details-modal max-h-[90vh] max-w-6xl overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-left">
            {project.name}
          </DialogTitle>
          <DialogDescription className="text-base text-left">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 py-4">
          {/* What's Included Card - Left */}
          <div className="flex-1 p-6 rounded-2xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">What's Included</h2>
            <div className="flex flex-col gap-3">
              {config.features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-white/90 text-sm">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Card - Right */}
          <div className="flex-1 p-6 rounded-2xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">Pricing</h2>
            <div className="flex flex-col gap-4">
              {config.pricing.map((item, index) => (
                <div 
                  key={index} 
                  className="relative p-4 rounded-2xl border-2 border-blue-500/50 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                        {item.type === "Image" && <Image className="w-5 h-5 text-blue-400" />}
                        {item.type === "Video" && <Video className="w-5 h-5 text-blue-400" />}
                        {item.type !== "Image" && item.type !== "Video" && <Check className="w-5 h-5 text-blue-400" />}
                      </div>
                      <span className="text-xl font-semibold text-white">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{item.price}</div>
                      <div className="text-sm text-white/60">{item.unit}</div>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
              ))}

              {/* Add to Dashboard Button */}
              {!isAdded ? (
                <Button 
                  className="w-full py-3 px-4 rounded-xl bg-blue-600/20 border border-blue-500/30 backdrop-blur-sm text-blue-400 font-medium flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors" 
                  onClick={onAddProject}
                  disabled={isLoading}
                  variant="ghost"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  <span>Add to Dashboard</span>
                </Button>
              ) : (
                <Button 
                  variant="ghost"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600/20 border border-blue-500/30 backdrop-blur-sm text-blue-400 font-medium flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors"
                  asChild
                >
                  <a href={project.route} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5" />
                    <span>Open Project</span>
                  </a>
                </Button>
              )}

              {/* Usage-Based Billing Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-500/40 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">Usage-Based Billing</h3>
                <p className="text-sm text-orange-200/80">
                  You only pay for what you generate. Costs are calculated based on actual content created through the AI models.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          {isAdded && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={onRemoveProject}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Remove from Dashboard</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
