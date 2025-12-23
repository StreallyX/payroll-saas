"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFUploadZoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  maxSize?: number; // in bytes, default 10MB
  className?: string;
}

/**
 * PDF upload zone with drag-and-drop and validation
 *
 * Validation:
 * - MIME type: application/pdf
 * - Extension: .pdf
 * - Max size: 10MB (configurable)
 */
export function PDFUploadZone({
  file,
  onChange,
  disabled = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
}: PDFUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate a PDF file
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check MIME type
    if (file.type !== "application/pdf") {
      return {
        valid: false,
        error: "The file must be a PDF",
      };
    }

    // Check extension
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return {
        valid: false,
        error: "The file must have a .pdf extension",
      };
    }

    // Check size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `The file must not exceed ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  };

  /**
   * Handle file selection
   */
  const handleFileChange = useCallback(
    (selectedFile: File | null) => {
      setError(null);

      if (!selectedFile) {
        onChange(null);
        return;
      }

      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }

      onChange(selectedFile);
    },
    [onChange, maxSize]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileChange(droppedFile);
      }
    },
    [disabled, handleFileChange]
  );

  /**
   * Handle browse button click
   */
  const handleBrowseClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const selectedFile = target.files?.[0];
      if (selectedFile) {
        handleFileChange(selectedFile);
      }
    };
    input.click();
  };

  /**
   * Remove selected file
   */
  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging && !disabled && "border-primary bg-primary/5",
            !isDragging &&
              "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <Upload
            className={cn(
              "h-10 w-10 text-muted-foreground",
              isDragging && "text-primary"
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium">
              Drag and drop your PDF file here
            </p>
            <p className="text-xs text-muted-foreground">or</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBrowseClick}
            disabled={disabled}
          >
            Browse
          </Button>
          <p className="text-xs text-muted-foreground">
            PDF only, max {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>
      ) : (
        // Selected file
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <FileText className="h-8 w-8 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
