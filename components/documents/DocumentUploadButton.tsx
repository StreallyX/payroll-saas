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

import { UploadCloud, FileIcon } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadButtonProps {
  entityType?: string;
  entityId?: string;
  parentDocumentId?: string; // for updateVersion
  onUploaded?: () => void;
}

export function DocumentUploadButton({
  entityType,
  entityId,
  parentDocumentId,
  onUploaded,
}: DocumentUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = api.document.upload.useMutation();
  const updateVersionMutation = api.document.updateVersion.useMutation();

  async function handleUpload() {
    if (!file) {
      toast.error("Please select a file.");
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
        });
      }

      toast.success("Document uploaded successfully!");

      setOpen(false);
      setFile(null);
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{parentDocumentId ? "Upload New Version" : "Upload Document"}</DialogTitle>
            <DialogDescription>
              Select a file to upload as a new document or version.
            </DialogDescription>
          </DialogHeader>

          <div
            className="border border-dashed rounded-md p-6 text-center cursor-pointer"
            onClick={() => document.getElementById("file-input")?.click()}
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
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!file}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
