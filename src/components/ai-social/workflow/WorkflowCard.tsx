import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2, Play, Pause, Rocket } from "lucide-react";
import { WorkflowBadge } from "./WorkflowBadge";
import type { Workflow } from "@/types/ai-social";
import { parseScheduleConfig } from "@/types/ai-social";

interface WorkflowCardProps {
  workflow: Workflow;
  isRunning: boolean;
  runningStage: "openai" | "nano" | "instagram" | null;
  onRunNow: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export function WorkflowCard({
  workflow,
  isRunning,
  runningStage,
  onRunNow,
  onEdit,
  onDelete,
  onToggleActive,
}: WorkflowCardProps) {
  const config = parseScheduleConfig(workflow.schedule_config);
  const isVideo = workflow.content_type === "video";

  const getScheduleText = () => {
    const frequency = config.frequency || "daily";
    const times = config.times || ["09:00"];
    
    if (frequency === "once") return `Once at ${times.join(", ")}`;
    if (frequency === "daily") return `Daily at ${times.join(", ")}`;
    if (frequency === "weekly") return `Weekly at ${times.join(", ")}`;
    return `Custom schedule at ${times.join(", ")}`;
  };

  return (
    <div className="labs-client-card rounded-[18px] bg-white/5 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-white">{workflow.name}</h3>
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            {/* Run Now Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRunNow}
              disabled={isRunning}
              className="bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary h-7 text-xs"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Rocket className="h-3 w-3 mr-1" />
                  Run Now
                </>
              )}
            </Button>

            {/* OpenAI Badge */}
            <WorkflowBadge 
              type="openai" 
              isActive={isRunning && runningStage === "openai"} 
            />

            {/* Generation Model Badge */}
            <WorkflowBadge 
              type={isVideo ? "veo3" : "nano"} 
              isActive={isRunning && runningStage === "nano"} 
            />

            {/* Social Platform Badges */}
            {workflow.platforms?.map((platform: string) => (
              <WorkflowBadge
                key={platform}
                type={platform as "instagram" | "linkedin" | "facebook" | "twitter"}
                isActive={isRunning && runningStage === "instagram" && platform === "instagram"}
              />
            ))}
          </div>

          <div className="mt-3 text-xs text-white/50">
            <span className="capitalize">{workflow.content_type}</span>
            {" · "}
            <span>{getScheduleText()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleActive}
            className="h-8 w-8"
            title={workflow.active ? "Pause workflow" : "Activate workflow"}
          >
            {workflow.active ? (
              <Pause className="h-4 w-4 text-yellow-400" />
            ) : (
              <Play className="h-4 w-4 text-green-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
