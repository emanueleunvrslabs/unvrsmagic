import { supabase } from "@/integrations/supabase/client";

const STORAGE_URL = "https://amvbkkbqkzklrcynpwwm.supabase.co/storage/v1/object/public/uploads";

export async function downloadTemplateFile(filePath: string): Promise<string> {
  const url = `${STORAGE_URL}/${filePath}`;
  const response = await fetch(url);
  return response.text();
}

export async function downloadTemplateImage(filePath: string): Promise<string> {
  return `${STORAGE_URL}/${filePath}`;
}
