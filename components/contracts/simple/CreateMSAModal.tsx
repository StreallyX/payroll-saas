"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, Info } from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { PDFUploadZone } from "../shared/PDFUploadZone";

interface CreateMSAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contractId: string) => void;
}

/**
 * MSA creation modal with PDF upload
 *
 * Process:
 * 1. Upload PDF
 * 2. Title is automatically generated
 * 3. Optional participants
 * 4. Contract is created in draft status
 */
export function CreateMSAModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateMSAModalProps) {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const createMutation =
    api.simpleContract.createSimpleMSA.useMutation({
      onSuccess: (data) => {
        toast.success("MSA created successfully");
        onSuccess?.(data.contract.id as string);
        setPdfFile(null);
        onOpenChange(false);
        router.push(`/contracts/simple/${data.contract.id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create the MSA");
      },
    });

  /**
   * Submit the form
   */
  const handleSubmit = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    try {
      // Convert file to base64
      const buffer = await pdfFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      createMutation.mutate({
        pdfBuffer: base64,
        fileName: pdfFile.name,
        mimeType: "application/pdf",
        fileSize: pdfFile.size,
      });
    } catch (error) {
      console.error("[CreateMSAModal] Error:", error);
      toast.error("Error while reading the file");
    }
  };

  /**
   * Close the modal
   */
  const handleClose = () => {
    if (!createMutation.isPending) {
      setPdfFile(null);
      onOpenChange(false);
    }
  };

  /**
   * Generate a preview title from the file name
   */
  const getPreviewTitle = (): string => {
    if (!pdfFile) return "";

    // Remove extension and format
    return pdfFile.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, " ")
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
      )
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create an MSA (Master Service Agreement)
          </DialogTitle>
          <DialogDescription>
            Upload your MSA PDF document. The title will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Information alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The MSA will serve as a master agreement to create future
              SOWs (Statements of Work).
            </AlertDescription>
          </Alert>

          {/* PDF upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="required">
              PDF document *
            </Label>
            <PDFUploadZone
              file={pdfFile}
              onChange={setPdfFile}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Title preview */}
          {pdfFile && (
            <div className="space-y-2">
              <Label>
                Contract title (automatically generated)
              </Label>
              <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                {getPreviewTitle() || "Untitled"}
              </div>
              <p className="text-xs text-muted-foreground">
                You will be able to edit this title after creation.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!pdfFile || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create MSA
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
