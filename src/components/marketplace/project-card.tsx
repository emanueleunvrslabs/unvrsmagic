"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">
              {project.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
              {project.description || "No description available"}
            </CardDescription>
          </div>
          {isAdded && (
            <Badge variant="secondary" className="ml-2 shrink-0">
              <Check className="h-3 w-3 mr-1" />
              Added
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-4 mt-auto">
        <div className="text-sm text-muted-foreground">
          {isAdded ? "Already in your dashboard" : "Available to add"}
        </div>
        <Button className="gap-1" onClick={() => onViewDetails(project)}>
          <span>Details</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
