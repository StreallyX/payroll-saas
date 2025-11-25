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
import { FileIcon, UploadCloud, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MainContractUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onSuccess?: () => void;
}

export function MainContractUploadModal({
  open,
  onOpenChange,
  contractId,
  onSuccess,
}: MainContractUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = api.document.upload.useMutation();
  const updateStatusMutation = api.contract.uploadMainDocument.useMutation();

  async function handleUpload() {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier.");
      return;
    }

    setIsUploading(true);

    try {
      // 1) Upload document to S3 via tRPC
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

      // 2) Update contract status to PENDING_APPROVAL
      await updateStatusMutation.mutateAsync({
        contractId: contractId,
        documentId: document.id,
      });

      toast.success("Document principal uploadé ! Le contrat est maintenant en attente d'approbation.");

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
            <UploadCloud className="h-5 w-5 text-orange-600" />
            Upload du contrat principal
          </DialogTitle>
          <DialogDescription>
            Uploadez le document principal du contrat. Cela fera passer le contrat en statut <strong>PENDING_APPROVAL</strong>.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Une fois le document uploadé, le contrat sera envoyé aux approvers pour validation.
          </AlertDescription>
        </Alert>

        <div
          className="border border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => document.getElementById("main-file-input")?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Cliquez pour sélectionner le document principal</p>
            </div>
          )}
        </div>

        <Input
          id="main-file-input"
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Annuler
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isUploading ? "Upload en cours..." : "Uploader le contrat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
