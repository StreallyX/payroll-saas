"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { useTimesheetDocuments } from "@/hooks/timesheets/useTimesheetDocuments";
import { toast } from "sonner";
import { uploadFile } from "@/lib/s3";

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
      // Upload file to S3
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const key = `timesheet-documents/${timesheetId}/${Date.now()}-${file.name}`;
      
      const uploadedKey = await uploadFile(buffer, key, file.type);
      
      // Create document record
      uploadDocument(
        {
          timesheetId,
          fileName: file.name,
          fileUrl: uploadedKey,
          fileSize: file.size,
          mimeType: file.type,
          description: description.trim(),
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
