export interface WorkflowFormState {
  workflowName: string;
  workflowType: "image" | "video";
  generationMode: string;
  description: string;
  aspectRatio: string;
  resolution: string;
  outputFormat: string;
  selectedPlatforms: string[];
  uploadedImages: string[];
  firstFrameImage: string;
  lastFrameImage: string;
  duration: string;
  generateAudio: boolean;
  scheduleFrequency: string;
  scheduleTimes: string[];
  scheduleDays: string[];
}

export const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
] as const;

export const IMAGE_COST = 1;
export const VIDEO_COST = 10;

export const initialFormState: WorkflowFormState = {
  workflowName: "",
  workflowType: "image",
  generationMode: "text-to-image",
  description: "",
  aspectRatio: "1:1",
  resolution: "1K",
  outputFormat: "png",
  selectedPlatforms: [],
  uploadedImages: [],
  firstFrameImage: "",
  lastFrameImage: "",
  duration: "6s",
  generateAudio: true,
  scheduleFrequency: "daily",
  scheduleTimes: ["09:00"],
  scheduleDays: ["monday", "wednesday", "friday"],
};
