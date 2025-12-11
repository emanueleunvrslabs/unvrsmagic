import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, X } from "lucide-react";
import { DAYS_OF_WEEK } from "./types";

interface ScheduleSectionProps {
  frequency: string;
  times: string[];
  days: string[];
  onFrequencyChange: (value: string) => void;
  onTimesChange: (times: string[]) => void;
  onDaysChange: (days: string[]) => void;
}

export function ScheduleSection({
  frequency,
  times,
  days,
  onFrequencyChange,
  onTimesChange,
  onDaysChange,
}: ScheduleSectionProps) {
  const handleDayToggle = (day: string) => {
    onDaysChange(
      days.includes(day) 
        ? days.filter(d => d !== day)
        : [...days, day]
    );
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    onTimesChange(newTimes);
  };

  const handleAddTime = () => {
    onTimesChange([...times, "12:00"]);
  };

  const handleRemoveTime = (index: number) => {
    onTimesChange(times.filter((_, i) => i !== index));
  };

  const getScheduleDescription = () => {
    const timeStr = times.join(", ");
    if (frequency === "once") return `Content will be generated and published once at ${timeStr}.`;
    if (frequency === "daily") return `Content will be generated and published daily at ${timeStr}.`;
    if (frequency === "weekly") return `Content will be generated and published weekly on selected days at ${timeStr}.`;
    return `Content will be generated and published on ${days.length} selected days at ${timeStr}.`;
  };

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Label className="text-base font-medium">Schedule</Label>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={onFrequencyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Once</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="custom">Custom Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Times</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddTime}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Time
            </Button>
          </div>
          <div className="space-y-2">
            {times.map((time, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(index, e.target.value)}
                  className="flex-1"
                />
                {times.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTime(index)}
                    className="h-9 w-9 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {(frequency === "weekly" || frequency === "custom") && (
        <div className="space-y-2">
          <Label>Days of Week</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <Button
                key={day.id}
                type="button"
                variant={days.includes(day.id) ? "default" : "outline"}
                size="sm"
                onClick={() => handleDayToggle(day.id)}
                className="w-12"
              >
                {day.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {getScheduleDescription()}
      </p>
    </div>
  );
}
