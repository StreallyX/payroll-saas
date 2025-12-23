"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { useContractDocuments } from "@/hooks/contracts/useContractDocuments";
import { toast } from "sonner";

interface DocumentUploaderProps {
  contractId: string;
  onSuccess?: () => void;
}

const DOCUMENT_CATEGORIES = [
  { value: "Contract", label: "Contract" },
  { value: "Invoice", label: "Invoice" },
  { value: "ID Document", label: "ID Document" },
  { value: "Signature", label: "Signature" },
  { value: "Other", label: "Other" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function DocumentUploader({ contractId, onSuccess }: DocumentUploaderProps) {
  const { uploadDocument, isUploading } = useContractDocuments(contractId);

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<
    "Contract" | "Invoice" | "ID Document" | "Signature" | "Other"
  >("Other");
  const [notes, setNotes] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // File size validation
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(
        `The file is too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`
      );
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
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const base64 = e.target?.result as string;
        const pdfBuffer = base64.split(",")[1]; // Remove data prefix

        uploadDocument(
          {
            contractId,
            pdfBuffer: pdfBuffer!,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            description: description.trim(),
            category,
            notes: notes.trim() || undefined,
          },
          {
            onSuccess: () => {
              toast.success("Document uploaded successfully");

              // Reset form
              setFile(null);
              setDescription("");
              setCategory("Other");
              setNotes("");

              // Reset file input
              const fileInput = document.getElementById(
                "file-upload"
              ) as HTMLInputElement;
              if (fileInput) fileInput.value = "";

              onSuccess?.();
            },
            onError: (error: any) => {
              toast.error(error.message || "Failed to upload the document");
            },
          }
        );
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to read the file");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload a document</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">File *</Label>
          <Input
            id="file-upload"
            type="file"
            accept="application/pdf,image/*,.doc,.docx"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            value={description}
            onChange={(e: any) => setDescription(e.target.value)}
            placeholder="e.g. November invoice"
            disabled={isUploading}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 characters
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={category}
            onValueChange={(value) =>
              setCategory(value as typeof category)
            }
            disabled={isUploading}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e: any) => setNotes(e.target.value)}
            placeholder="Additional instructions or information..."
            disabled={isUploading}
            maxLength={1000}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {notes.length}/1000 characters
          </p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleUpload}
          disabled={isUploading || !file || !description.trim()}
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
              Upload document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
