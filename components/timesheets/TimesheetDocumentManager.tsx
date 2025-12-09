"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2, Eye, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/s3";

interface DocumentFile {
  id: string;
  name: string;
  url: string;       // <-- S3 KEY (not a public URL)
  size: number;
  uploadedAt: Date;
}

interface TimesheetDocumentManagerProps {
  documents: DocumentFile[];
  onDocumentsChange: (documents: DocumentFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function TimesheetDocumentManager({
  documents,
  onDocumentsChange,
  maxFiles = 10,
  disabled = false,
}: TimesheetDocumentManagerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (documents.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(
        `Some files exceed the maximum size of ${MAX_FILE_SIZE / 1024 / 1024} MB`
      );
      return;
    }

    setIsUploading(true);

    try {
      const uploadedDocs: DocumentFile[] = [];

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Build S3 key
        const key = `timesheet-expenses/${Date.now()}-${file.name}`;

        // Upload
        const uploadedKey = await uploadFile(buffer, key, file.type);

        // Store KEY (not URL)
        uploadedDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: uploadedKey, // <-- This is the S3 KEY
          size: file.size,
          uploadedAt: new Date(),
        });
      }

      if (uploadedDocs.length > 0) {
        onDocumentsChange([...documents, ...uploadedDocs]);
        toast.success(`${uploadedDocs.length} file(s) uploaded successfully`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveDocument = (docId: string) => {
    onDocumentsChange(documents.filter(d => d.id !== docId));
    toast.success("Document removed");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expense Documents</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload */}
        <div className="space-y-2">
          <Label htmlFor="expense-files">
            Upload Expense Receipts ({documents.length}/{maxFiles})
          </Label>

          <div className="flex gap-2">
            <Input
              id="expense-files"
              type="file"
              multiple
              accept="application/pdf,image/*,.doc,.docx"
              onChange={handleFileUpload}
              disabled={disabled || isUploading || documents.length >= maxFiles}
              className="flex-1"
            />

            {isUploading && (
              <Button disabled size="icon" variant="outline">
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            )}
          </div>
        </div>

        {/* Documents */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Documents</Label>

            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">
                        Expense File {index + 1}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.name} • {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = doc.url;
                        link.download = doc.name;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No expense documents uploaded
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
