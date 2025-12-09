"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, Info, Link as LinkIcon } from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { PDFUploadZone } from "../shared/PDFUploadZone";
import { ParticipantPreSelector, type ParticipantPreSelection } from "../shared/ParticipantPreSelector";

interface CreateSOWModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedMSAId?: string;
  onSuccess?: (contractId: string) => void;
}

/**
 * Modal de création de SOW lié à un MSA
 * 
 * Processus:
 * 1. Sélection du MSA parent
 * 2. Upload PDF
 * 3. Titre généré automatiquement
 * 4. Création du contrat SOW en draft
 */
export function CreateSOWModal({
  open,
  onOpenChange,
  preselectedMSAId,
  onSuccess,
}: CreateSOWModalProps) {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parentMSAId, setParentMSAId] = useState<string>(preselectedMSAId || "");
  const [additionalParticipants, setAdditionalParticipants] = useState<ParticipantPreSelection[]>([]);

  // Reset parentMSAId when modal opens with preselected value
  useEffect(() => {
    if (preselectedMSAId) {
      setParentMSAId(preselectedMSAId);
    }
  }, [preselectedMSAId]);

  // Récupérer la liste des MSA disponibles
  const { data: msaList, isLoading: isLoadingMSAs } = api.simpleContract.listSimpleContracts.useQuery(
    {
      type: "msa",
      status: "all",
      page: 1,
      pageSize: 100,
    },
    {
      enabled: open, // Ne charger que quand le modal est ouvert
    }
  );

  const createMutation = api.simpleContract.createSimpleSOW.useMutation({
    onSuccess: (data) => {
      toast.success("SOW créé avec succès");
      onSuccess?.(data.contract.id as string);
      setPdfFile(null);
      setParentMSAId("");
      onOpenChange(false);
      router.push(`/contracts/simple/${data.contract.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la création du SOW");
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

    if (!parentMSAId) {
      toast.error("Veuillez sélectionner un MSA parent");
      return;
    }

    try {
      // Convertir le fichier en base64
      const buffer = await pdfFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Préparer les participants (enlever les champs temporaires)
      const participants = additionalParticipants.map(p => ({
        userId: p.userId,
        companyId: p.companyId,
        role: p.role,
      }));

      createMutation.mutate({
        parentMSAId,
        pdfBuffer: base64,
        fileName: pdfFile.name,
        mimeType: "application/pdf",
        fileSize: pdfFile.size,
        additionalParticipants: participants.length > 0 ? participants : undefined,
      });
    } catch (error) {
      console.error("[CreateSOWModal] Error:", error);
      toast.error("Erreur lors de la lecture du fichier");
    }
  };

  /**
   * Ferme le modal
   */
  const handleClose = () => {
    if (!createMutation.isPending) {
      setPdfFile(null);
      setAdditionalParticipants([]);
      if (!preselectedMSAId) {
        setParentMSAId("");
      }
      onOpenChange(false);
    }
  };

  /**
   * Génère un titre prévisualisé
   */
  const getPreviewTitle = (): string => {
    if (!pdfFile) return "";
    return pdfFile.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const availableMSAs = msaList?.contracts || [];
  const selectedMSA = availableMSAs.find((msa) => msa.id === parentMSAId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Créer un SOW (Statement of Work)
          </DialogTitle>
          <DialogDescription>
            Créez un SOW lié à un MSA existant. Le titre sera généré automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Alert d'information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Le SOW héritera automatiquement des paramètres de son MSA parent.
            </AlertDescription>
          </Alert>

          {/* Sélection du MSA parent */}
          <div className="space-y-2">
            <Label htmlFor="parent-msa" className="required flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              MSA Parent *
            </Label>
            <Select
              value={parentMSAId}
              onValueChange={setParentMSAId}
              disabled={createMutation.isPending || !!preselectedMSAId || isLoadingMSAs}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un MSA..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingMSAs ? (
                  <SelectItem value="loading" disabled>
                    Chargement des MSA...
                  </SelectItem>
                ) : availableMSAs.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Aucun MSA disponible
                  </SelectItem>
                ) : (
                  availableMSAs.map((msa) => (
                    <SelectItem key={msa.id} value={msa.id}>
                      {msa.title || "Sans titre"} ({msa.status})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedMSA && (
              <p className="text-xs text-muted-foreground">
                Le SOW sera lié à: <strong>{selectedMSA.title || "Sans titre"}</strong>
              </p>
            )}
          </div>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="required">
              Document PDF *
            </Label>
            <PDFUploadZone
              file={pdfFile}
              onChange={setPdfFile}
              disabled={createMutation.isPending}
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

          {/* Participants supplémentaires */}
          <div className="border-t pt-4">
            <ParticipantPreSelector
              participants={additionalParticipants}
              onChange={setAdditionalParticipants}
              showAddButton={true}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!pdfFile || !parentMSAId || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Créer le SOW
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
