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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileIcon, Upload, AlertCircle, PenTool } from "lucide-react";
import { toast } from "sonner";

interface SignatureUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onSuccess?: () => void;
}

export function SignatureUploadModal({
  open,
  onOpenChange,
  contractId,
  onSuccess,
}: SignatureUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = api.document.upload.useMutation();
  const signMutation = api.contract.uploadSignedContract.useMutation();

  async function handleUpload() {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier.");
      return;
    }

    // Validate PDF
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés pour les contrats signés.");
      return;
    }

    setIsUploading(true);

    try {
      // 1) Upload signed document to S3
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const document = await uploadMutation.mutateAsync({
        entityType: "contract",
        entityId: contractId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        buffer: base64,
      });

      // 2) Mark participant as signed
      await signMutation.mutateAsync({
        contractId: contractId,
        documentId: document.id,
      });

      toast.success("Contrat signé uploadé avec succès !");

      setFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Échec de l'upload");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-blue-600" />
            Upload du contrat signé
          </DialogTitle>
          <DialogDescription>
            Uploadez le contrat signé au format PDF. Cela marquera votre signature comme complétée.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez vous assurer que le contrat est correctement signé avant de l'uploader.
            Une fois toutes les signatures collectées, le contrat passera au statut <strong>COMPLETED</strong>.
          </AlertDescription>
        </Alert>

        <div
          className="border border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => document.getElementById("signature-file-input")?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileIcon className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Cliquez pour sélectionner le PDF signé</p>
              <p className="text-xs text-muted-foreground">Format accepté : PDF uniquement</p>
            </div>
          )}
        </div>

        <Input
          id="signature-file-input"
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Annuler
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? "Upload en cours..." : "Uploader le contrat signé"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
