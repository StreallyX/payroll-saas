"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UploadCloud, FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Document type categories for contractors
const DOCUMENT_CATEGORIES = [
  { value: "passport", label: "Passport" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "drivers_license", label: "Drivers License" },
  { value: "residence_card", label: "Residence Card" },
  { value: "medical_insurance", label: "Medical Insurance Certificate" },
  { value: "other", label: "Other" },
];

interface DocumentUploadButtonProps {
  entityType?: string;
  entityId?: string;
  parentDocumentId?: string; // for updateVersion
  onUploaded?: () => void;
  showCategorySelector?: boolean; // Show document type dropdown
}

export function DocumentUploadButton({
  entityType,
  entityId,
  parentDocumentId,
  onUploaded,
  showCategorySelector = true,
}: DocumentUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  const uploadMutation = api.document.upload.useMutation();
  const updateVersionMutation = api.document.updateVersion.useMutation();

  const isUploading = uploadMutation.isPending || updateVersionMutation.isPending;

  async function handleUpload() {
    // Prevent double-clicks
    if (isUploading) return;
    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    // Require document type selection for new uploads (not version updates)
    if (!parentDocumentId && showCategorySelector && !category) {
      toast.error("Please select a document type.");
      return;
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    try {
      let result;

      if (parentDocumentId) {
        // upload new version
        result = await updateVersionMutation.mutateAsync({
          documentId: parentDocumentId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          buffer: base64,
        });
      } else {
        // new document
        result = await uploadMutation.mutateAsync({
          entityType,
          entityId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          buffer: base64,
          category: category || undefined,
          description: comments || undefined,
        });
      }

      toast.success("Document uploaded successfully!");

      setOpen(false);
      setFile(null);
      setCategory("");
      setComments("");
      onUploaded?.();
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed");
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UploadCloud className="w-4 h-4" />
        Upload Document
      </Button>

      <Dialog open={open} onOpenChange={(newOpen) => !isUploading && setOpen(newOpen)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{parentDocumentId ? "Upload New Version" : "Upload Document"}</DialogTitle>
            <DialogDescription>
              Select a file to upload as a new document or version.
            </DialogDescription>
          </DialogHeader>

          <div
            className={`border border-dashed rounded-md p-6 text-center ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => !isUploading && document.getElementById("file-input")?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileIcon className="w-5 h-5" />
                <p>{file.name} ({Math.round(file.size / 1024)} KB)</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Click to select a file</p>
            )}
          </div>

          <Input
            id="file-input"
            type="file"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          {/* Document Type Selector - Only for new uploads, not version updates */}
          {!parentDocumentId && showCategorySelector && (
            <div className="space-y-2">
              <Label htmlFor="doc-category">Document Type *</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={isUploading}
              >
                <SelectTrigger id="doc-category">
                  <SelectValue placeholder="Select document type" />
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
          )}

          {/* Comments Field - Only for new uploads */}
          {!parentDocumentId && showCategorySelector && (
            <div className="space-y-2">
              <Label htmlFor="doc-comments">Comments</Label>
              <Textarea
                id="doc-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={isUploading}
                placeholder="Add any notes about this document..."
                rows={3}
              />
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
