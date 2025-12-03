"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";

interface ModifyContractModalProps {
  contract: {
    id: string;
    title: string | null;
    description: string | null;
    type: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal pour modifier les informations de base d'un contrat
 * 
 * Permet de modifier:
 * - Le titre
 * - La description
 * 
 * Note: Les participants et documents peuvent être modifiés directement sur la vue détaillée
 */
export function ModifyContractModal({
  contract,
  isOpen,
  onClose,
  onSuccess,
}: ModifyContractModalProps) {
  const utils = api.useUtils();
  
  const [title, setTitle] = useState(contract.title || "");
  const [description, setDescription] = useState(contract.description || "");

  // Réinitialiser les champs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTitle(contract.title || "");
      setDescription(contract.description || "");
    }
  }, [isOpen, contract]);

  // Mutation pour mettre à jour le contrat
  const updateMutation = api.simpleContract.updateSimpleContract.useMutation({
    onSuccess: () => {
      toast.success("Contrat mis à jour avec succès");
      void utils.simpleContract.getSimpleContractById.invalidate({ id: contract.id });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la mise à jour du contrat");
    },
  });

  /**
   * Soumet le formulaire
   */
  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    updateMutation.mutate({
      contractId: contract.id,
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  /**
   * Ferme le modal
   */
  const handleClose = () => {
    if (!updateMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le contrat</DialogTitle>
          <DialogDescription>
            Modifiez les informations de base du contrat. Les participants et documents peuvent être
            modifiés directement sur la vue détaillée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title" className="required">
              Titre *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du contrat"
              disabled={updateMutation.isPending}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/200 caractères
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle du contrat..."
              disabled={updateMutation.isPending}
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 caractères
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={updateMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
