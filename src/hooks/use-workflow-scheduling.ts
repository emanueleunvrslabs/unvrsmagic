import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface ScheduleConfig {
  frequency: string;
  times: string[];
  days: string[];
  generation_mode?: string;
  aspect_ratio?: string;
  resolution?: string;
  output_format?: string;
  image_urls?: string[];
  reference_image_url?: string;
  first_frame_url?: string;
  last_frame_url?: string;
  duration?: string;
  generate_audio?: boolean;
}

/**
 * Calculate next scheduled times based on schedule config
 */
export function calculateNextScheduledTimes(
  frequency: string,
  times: string[],
  days: string[],
  daysToSchedule: number = 7
): Date[] {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const scheduledDates: Date[] = [];
  const now = new Date();
  const sortedTimes = [...times].sort();

  for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    const dayName = dayNames[checkDate.getDay()];

    // Check if this day is valid for the frequency
    let isDayValid = false;
    if (frequency === "daily") {
      isDayValid = true;
    } else if (frequency === "weekly" || frequency === "custom") {
      isDayValid = days.includes(dayName);
    } else if (frequency === "once") {
      isDayValid = dayOffset === 0; // Only today for "once"
    }

    if (!isDayValid) continue;

    // Add each time slot for this day
    for (const timeStr of sortedTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const candidateTime = new Date(checkDate);
      candidateTime.setHours(hours, minutes, 0, 0);

      // Only add future times (at least 1 minute from now)
      if (candidateTime.getTime() > now.getTime() + 60000) {
        scheduledDates.push(candidateTime);
      }
    }
  }

  return scheduledDates;
}

/**
 * Create scheduled posts for a workflow
 */
export async function createScheduledPosts(
  workflowId: string,
  userId: string,
  scheduleConfig: ScheduleConfig,
  platforms: string[]
): Promise<void> {
  const { frequency, times, days } = scheduleConfig;
  
  // Calculate next 7 days of scheduled times
  const scheduledTimes = calculateNextScheduledTimes(frequency, times, days, 7);
  
  if (scheduledTimes.length === 0) {
    console.log("No scheduled times calculated");
    return;
  }

  console.log(`Creating ${scheduledTimes.length} scheduled posts`);

  // Insert scheduled posts
  const postsToInsert = scheduledTimes.map(scheduledAt => ({
    workflow_id: workflowId,
    user_id: userId,
    scheduled_at: scheduledAt.toISOString(),
    status: 'scheduled',
    platforms: platforms,
    metadata: JSON.parse(JSON.stringify({ schedule_config: scheduleConfig })) as Json
  }));

  const { error } = await supabase
    .from('ai_social_scheduled_posts')
    .insert(postsToInsert);

  if (error) {
    console.error("Error creating scheduled posts:", error);
    throw error;
  }
}

/**
 * Delete all scheduled posts for a workflow
 */
export async function deleteScheduledPosts(workflowId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_social_scheduled_posts')
    .delete()
    .eq('workflow_id', workflowId)
    .eq('status', 'scheduled');

  if (error) {
    console.error("Error deleting scheduled posts:", error);
  }
}
