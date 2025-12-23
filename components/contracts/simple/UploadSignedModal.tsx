"use client";

import { useState } from "react";
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
import { Loader2, Upload, FileSignature, Info } from "lucide-react";
import { PDFUploadZone } from "../shared/PDFUploadZone";
import { useContractDocument } from "@/hooks/contracts/useContractDocument";

interface UploadSignedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractTitle?: string;
  onSuccess?: () => void;
}

/**
 * Modal for uploading a signed version of a contract
 *
 * Process:
 * 1. Upload the signed PDF
 * 2. Create a new document version
 * 3. Mark the document as signed
 */
export function UploadSignedModal({
  open,
  onOpenChange,
  contractId,
  contractTitle,
  onSuccess,
}: UploadSignedModalProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { uploadSignedWithValidation, isProcessing } =
    useContractDocument();

  /**
   * Submit the form
   */
  const handleSubmit = async () => {
    if (!pdfFile) {
      return;
    }

    await uploadSignedWithValidation(contractId, pdfFile);
    setPdfFile(null);
    onSuccess?.();
    onOpenChange(false);
  };

  /**
   * Close the modal
   */
  const handleClose = () => {
    if (!isProcessing) {
      setPdfFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Upload signed version
          </DialogTitle>
          <DialogDescription>
            {contractTitle
              ? `Upload the signed version of the contract "${contractTitle}"`
              : "Upload the signed version of the contract"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Information alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This new version will replace the current one and
              will be marked as signed.
            </AlertDescription>
          </Alert>

          {/* PDF upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="required">
              Signed PDF document *
            </Label>
            <PDFUploadZone
              file={pdfFile}
              onChange={setPdfFile}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              The document must be in PDF format and include all
              required signatures.
            </p>
          </div>

          {/* Additional information */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h4 className="text-sm font-medium">
              What happens after the upload?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>A new version of the document will be created</li>
              <li>
                The previous version will remain accessible in
                the history
              </li>
              <li>
                The document will be marked as signed with the
                current date
              </li>
              <li>The contract status will remain unchanged</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!pdfFile || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
