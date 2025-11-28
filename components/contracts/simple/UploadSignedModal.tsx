"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
 * Modal pour uploader une version signée du contrat
 * 
 * Processus:
 * 1. Upload PDF signé
 * 2. Création d'une nouvelle version du document
 * 3. Marquage comme document signé
 */
export function UploadSignedModal({
  open,
  onOpenChange,
  contractId,
  contractTitle,
  onSuccess,
}: UploadSignedModalProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { uploadSignedWithValidation, isProcessing } = useContractDocument();

  /**
   * Soumet le formulaire
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
   * Ferme le modal
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
            Uploader la version signée
          </DialogTitle>
          <DialogDescription>
            {contractTitle 
              ? `Uploadez la version signée du contrat "${contractTitle}"`
              : "Uploadez la version signée du contrat"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Alert d'information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Cette nouvelle version remplacera la version actuelle et sera marquée comme signée.
            </AlertDescription>
          </Alert>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="required">
              Document PDF signé *
            </Label>
            <PDFUploadZone
              file={pdfFile}
              onChange={setPdfFile}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Le document doit être au format PDF et contenir toutes les signatures requises
            </p>
          </div>

          {/* Informations supplémentaires */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h4 className="text-sm font-medium">Que se passe-t-il après l'upload ?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Une nouvelle version du document sera créée</li>
              <li>L'ancienne version restera accessible dans l'historique</li>
              <li>Le document sera marqué comme signé avec la date actuelle</li>
              <li>Le statut du contrat restera inchangé</li>
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
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!pdfFile || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Uploader
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
