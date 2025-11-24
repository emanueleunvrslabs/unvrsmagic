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
import { Plus, Check, Loader2, ExternalLink } from "lucide-react";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            {project.icon && <span className="text-3xl">{project.icon}</span>}
            {project.name}
          </DialogTitle>
          <DialogDescription>
            {project.description || "No description available"}
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
                  <span className="text-sm text-muted-foreground">Route Path</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {project.route}
                  </code>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Project Type</span>
                  <Badge variant="outline">Marketplace Project</Badge>
                </div>
              </div>
            </div>

            {/* Project Features */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">What's Included</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Full access to project features and functionality</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Integration with your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Real-time updates and synchronization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Manage directly from your sidebar menu</span>
                </li>
              </ul>
            </div>

            {/* Getting Started */}
            {!isAdded && (
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="mb-2 text-sm font-semibold">Getting Started</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Add to Dashboard" below to add this project to your personal workspace. 
                  It will appear in your sidebar navigation and you'll be able to access it anytime.
                </p>
              </div>
            )}
          </div>

          {/* Right column - Purchase Options */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Purchase Options</h3>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Access Type</span>
                    <Badge variant="outline" className="border-green-500 text-green-500">
                      Free
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    This project is available at no cost. Add it to your dashboard to get started.
                  </p>
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
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">License</span>
                    <span className="font-medium">Free to Use</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Updates</span>
                    <span className="font-medium">Lifetime</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Support</span>
                    <span className="font-medium">Included</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Project Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Category</span>
                  <Badge variant="secondary">Application</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Version</span>
                  <span className="text-sm font-medium">Latest</span>
                </div>
              </div>
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
              <span>Add Now</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
