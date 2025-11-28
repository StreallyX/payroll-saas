"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
 * Modal de création de MSA avec upload PDF
 * 
 * Processus:
 * 1. Upload PDF
 * 2. Titre généré automatiquement
 * 3. Company optionnel
 * 4. Création du contrat en draft
 */
export function CreateMSAModal({ open, onOpenChange, onSuccess }: CreateMSAModalProps) {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const createMutation = api.simpleContract.createSimpleMSA.useMutation({
    onSuccess: (data) => {
      toast.success("MSA créé avec succès");
      onSuccess?.(data.contract.id);
      setPdfFile(null);
      onOpenChange(false);
      router.push(`/contracts/simple/${data.contract.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la création du MSA");
    },
  });

  /**
   * Soumet le formulaire
   */
  const handleSubmit = async () => {
    if (!pdfFile) {
      toast.error("Veuillez sélectionner un fichier PDF");
      return;
    }

    try {
      // Convertir le fichier en base64
      const buffer = await pdfFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      createMutation.mutate({
        pdfBuffer: base64,
        fileName: pdfFile.name,
        mimeType: pdfFile.type,
        fileSize: pdfFile.size,
      });
    } catch (error) {
      console.error("[CreateMSAModal] Error:", error);
      toast.error("Erreur lors de la lecture du fichier");
    }
  };

  /**
   * Ferme le modal
   */
  const handleClose = () => {
    if (!createMutation.isLoading) {
      setPdfFile(null);
      onOpenChange(false);
    }
  };

  /**
   * Génère un titre prévisualisé
   */
  const getPreviewTitle = (): string => {
    if (!pdfFile) return "";
    // Enlever l'extension et formatter
    return pdfFile.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Créer un MSA (Master Service Agreement)
          </DialogTitle>
          <DialogDescription>
            Uploadez votre document PDF MSA. Le titre sera généré automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Alert d'information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Le MSA servira de contrat cadre pour créer des SOW (Statements of Work) ultérieurement.
            </AlertDescription>
          </Alert>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="required">
              Document PDF *
            </Label>
            <PDFUploadZone
              file={pdfFile}
              onChange={setPdfFile}
              disabled={createMutation.isLoading}
            />
          </div>

          {/* Prévisualisation du titre */}
          {pdfFile && (
            <div className="space-y-2">
              <Label>Titre du contrat (généré automatiquement)</Label>
              <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                {getPreviewTitle() || "Sans titre"}
              </div>
              <p className="text-xs text-muted-foreground">
                Vous pourrez modifier ce titre après la création
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!pdfFile || createMutation.isLoading}
          >
            {createMutation.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Créer le MSA
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
