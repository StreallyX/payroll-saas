"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useSimpleContractWorkflow } from "@/hooks/contracts/useSimpleContractWorkflow";
import { ContractStatusBadge } from "./ContractStatusBadge";

interface Contract {
  id: string;
  title: string | null;
  type: string;
  status: string;
  description?: string | null;
  createdAt: Date | string;
}

interface AdminReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  onSuccess?: () => void;
}

/**
 * Modal d'approbation/rejet pour les administrateurs
 * 
 * Actions:
 * - Approuver: passe le contrat de pending_admin_review à completed
 * - Rejeter: remet le contrat en draft avec une raison
 */
export function AdminReviewModal({
  open,
  onOpenChange,
  contract,
  onSuccess,
}: AdminReviewModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const { approveContract, rejectContract, isApproving, isRejecting } = useSimpleContractWorkflow();

  const isProcessing = isApproving || isRejecting;

  /**
   * Approuve le contrat
   */
  const handleApprove = async () => {
    setAction("approve");
    await approveContract.mutateAsync({
      contractId: contract.id,
      notes: notes || undefined,
    });
    setAction(null);
    setNotes("");
    onSuccess?.();
    onOpenChange(false);
  };

  /**
   * Rejette le contrat
   */
  const handleReject = async () => {
    const trimmedReason = reason.trim();
    
    // Validation : minimum 10 caractères requis
    if (!trimmedReason || trimmedReason.length < 10) {
      return;
    }

    setAction("reject");
    await rejectContract.mutateAsync({
      contractId: contract.id,
      reason: trimmedReason,
    });
    setAction(null);
    setReason("");
    onSuccess?.();
    onOpenChange(false);
  };

  /**
   * Ferme le modal
   */
  const handleClose = () => {
    if (!isProcessing) {
      setAction(null);
      setNotes("");
      setReason("");
      onOpenChange(false);
    }
  };

  /**
   * Formate la date
   */
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const isMSA = contract.type === "msa";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Validation du contrat
          </DialogTitle>
          <DialogDescription>
            Approuvez ou rejetez ce contrat en attente de validation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations du contrat */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-lg">{contract.title || "Sans titre"}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Type: <span className="font-medium">{isMSA ? "MSA" : "SOW"}</span> • 
                  Créé le {formatDate(contract.createdAt)}
                </p>
              </div>
              <ContractStatusBadge status={contract.status as any} />
            </div>
            {contract.description && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">{contract.description}</p>
              </div>
            )}
          </div>

          {/* Action selector */}
          {!action && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Choisissez une action ci-dessous pour valider ou rejeter ce contrat.
              </AlertDescription>
            </Alert>
          )}

          {/* Formulaire d'approbation */}
          {action === "approve" && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Vous vous apprêtez à approuver ce contrat. Il passera au statut "Complété".
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="approve-notes">Notes (optionnel)</Label>
                <Textarea
                  id="approve-notes"
                  placeholder="Ajouter des notes pour cette approbation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isProcessing}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Formulaire de rejet */}
          {action === "reject" && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Vous vous apprêtez à rejeter ce contrat. Il sera remis en brouillon.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reject-reason" className="required">
                    Raison du rejet *
                  </Label>
                  <span className={`text-xs ${
                    reason.trim().length < 10 
                      ? "text-red-500 font-medium" 
                      : "text-muted-foreground"
                  }`}>
                    {reason.trim().length} / 10 caractères minimum
                  </span>
                </div>
                <Textarea
                  id="reject-reason"
                  placeholder="Expliquez pourquoi vous rejetez ce contrat (minimum 10 caractères)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isProcessing}
                  rows={4}
                  className={reason.trim().length > 0 && reason.trim().length < 10 ? "border-red-300" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Cette raison sera visible par le créateur du contrat
                </p>
                {reason.trim().length > 0 && reason.trim().length < 10 && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠️ La raison doit contenir au moins 10 caractères
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Actions principales */}
          {!action ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="sm:order-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => setAction("reject")}
                className="sm:order-2"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rejeter
              </Button>
              <Button
                onClick={() => setAction("approve")}
                className="sm:order-3 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approuver
              </Button>
            </>
          ) : action === "approve" ? (
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={isProcessing}
              >
                Retour
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approbation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmer l'approbation
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={isProcessing}
              >
                Retour
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!reason.trim() || reason.trim().length < 10 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejet...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Confirmer le rejet
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
