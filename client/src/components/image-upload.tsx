import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/hooks/use-upload";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label,
  accept = "image/*",
  className,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, error, progress } = useUpload({
    onSuccess: (response) => {
      const imageUrl = response.objectPath;
      onChange(imageUrl);
      setPreview(null);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await uploadFile(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    onChange("");
    setPreview(null);
  };

  const displayUrl = value || preview;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0 w-24 h-24 rounded-md border border-dashed border-muted-foreground/25 overflow-hidden bg-muted/50">
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {!disabled && !isUploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={handleClear}
                  data-testid="button-clear-image"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-50" />
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs mt-1">{progress}%</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
            data-testid="input-file-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            data-testid="button-upload-image"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
          {error && (
            <p className="text-xs text-destructive">{error.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
