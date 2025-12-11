import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Upload, X } from "lucide-react";

interface ImageUploadSectionProps {
  label: string;
  description?: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
  multiple?: boolean;
}

export function ImageUploadSection({
  label,
  description,
  images,
  onImagesChange,
  isUploading,
  setIsUploading,
  multiple = true,
}: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newImageUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await readFileAsDataUrl(file);
        newImageUrls.push(dataUrl);
      }

      onImagesChange([...images, ...newImageUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="border border-dashed border-border rounded-lg p-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple={multiple}
          className="hidden"
        />
        
        {images.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add More Images
                </>
              )}
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {description || "Click to upload images"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP supported</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
