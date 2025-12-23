"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { useTimesheetDocuments } from "@/hooks/timesheets/useTimesheetDocuments";
import { toast } from "sonner";

interface TimesheetDocumentUploaderProps {
  timesheetId: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Component to upload timesheet documents
 * Mirrors the contract DocumentUploader component
 */
export function TimesheetDocumentUploader({ 
  timesheetId, 
  onSuccess,
  disabled = false 
}: TimesheetDocumentUploaderProps) {
  const { uploadDocument, isUploading } = useTimesheetDocuments(timesheetId);
  
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File is too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`);
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    
    if (!description.trim()) {
      toast.error("Please provide a description");
      return;
    }
    
    try {
      // 🔥 FIX: Convert file to base64 (matching contract pattern)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = (error) => reject(error);
      });
      
      // 🔥 FIX: Send base64 to backend (backend handles S3 upload)
      uploadDocument(
        {
          timesheetId,
          fileName: file.name,
          fileBuffer: base64, // Send base64 instead of fileUrl
          fileSize: file.size,
          mimeType: file.type,
          description: description.trim(),
          category: "timesheet", // Default category
        },
        {
          onSuccess: () => {
            toast.success("Document uploaded successfully");
            // Reset form
            setFile(null);
            setDescription("");
            // Reset file input
            const fileInput = document.getElementById("timesheet-file-upload") as HTMLInputElement;
            if (fileInput) fileInput.value = "";
            
            onSuccess?.();
          },
          onError: (error: any) => {
            toast.error(error.message || "Failed to upload document");
          },
        }
      );
    } catch (error) {
      toast.error("Failed to read file");
    }
  };
  
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label htmlFor="timesheet-file-upload">File *</Label>
        <Input
          id="timesheet-file-upload"
          type="file"
          accept="application/pdf,image/*,.doc,.docx"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
        {file && (
          <p className="text-xs text-muted-foreground">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Expense receipt for December"
          disabled={disabled || isUploading}
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/500 characters
        </p>
      </div>
      
      <Button
        onClick={handleUpload}
        disabled={disabled || isUploading || !file || !description.trim()}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </>
        )}
      </Button>
    </div>
  );
}
