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
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {project.name}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-3">
          {/* Left column - Project Information */}
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Project Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={isAdded ? "default" : "secondary"}>
                    {isAdded ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Added to Dashboard
                      </>
                    ) : (
                      "Available"
                    )}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="outline">{config.category}</Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="text-sm font-medium">Latest</span>
                </div>
              </div>
            </div>

            {/* Project Features */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">What's Included</h3>
              <ul className="space-y-3 text-sm">
                {config.features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <span className="pt-0.5">{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Getting Started */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="mb-2 text-sm font-semibold">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                {!isAdded 
                  ? "Click 'Add Now' to add this project to your personal workspace. It will appear in your sidebar navigation and you'll be able to access it anytime."
                  : "This project is already added to your dashboard. You can access it from your sidebar navigation or click 'Open Project' to view it now."}
              </p>
            </div>
          </div>

          {/* Right column - Pricing */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Pricing</h3>
              <div className="space-y-4">
                {config.pricing.map((item, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "rounded-md border p-3",
                      index === 0 && "border-2 border-primary bg-primary/5"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === "Image" && <Image className="h-4 w-4 text-primary" />}
                        {item.type === "Video" && <Video className="h-4 w-4 text-primary" />}
                        <span className="font-medium">{item.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{item.price}</div>
                        <div className="text-xs text-muted-foreground">{item.unit}</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}

                <Separator />

                {/* Add Project Button */}
                {!isAdded ? (
                  <Button 
                    className="w-full gap-2" 
                    onClick={onAddProject}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>Add to Dashboard</span>
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    asChild
                  >
                    <a href={project.route} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      <span>Open Project</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Usage Note */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h4 className="mb-2 text-sm font-semibold text-amber-400">Usage-Based Billing</h4>
              <p className="text-xs text-muted-foreground">
                You only pay for what you generate. Costs are calculated based on actual content created through the AI models.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          {isAdded ? (
            <>
              <Button
                variant="outline"
                className="gap-2"
                asChild
              >
                <a href={project.route} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Project</span>
                </a>
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={onRemoveProject}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>Remove from Dashboard</span>
              </Button>
            </>
          ) : (
            <Button
              className="gap-2"
              onClick={onAddProject}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Add to Dashboard</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
