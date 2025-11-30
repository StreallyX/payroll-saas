"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSignature, CheckCircle, Info, Loader2, Calendar } from "lucide-react";
import { useNormContract } from "@/hooks/contracts/useNormContract";
import { toast } from "sonner";

interface ContractorSignatureSectionProps {
  contract: {
    id: string;
    title: string | null;
    contractorSignedAt?: Date | string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
  };
  onSuccess?: () => void;
}

/**
 * Section pour permettre au contractor de signer le contrat
 * 
 * Affiche:
 * - Les informations du contrat
 * - Bouton "Signer le contrat"
 * - Modal de confirmation avec date de signature
 * - Statut de signature (signé ou non)
 */
export function ContractorSignatureSection({
  contract,
  onSuccess,
}: ContractorSignatureSectionProps) {
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureDate, setSignatureDate] = useState<string>(
    new Date().toISOString().split("T")[0] // Date du jour par défaut
  );

  const { contractorSignContract, isSigning } = useNormContract();

  const isAlreadySigned = !!contract.contractorSignedAt;

  /**
   * Gère la signature du contrat
   */
  const handleSign = async () => {
    if (!signatureDate) {
      toast.error("Veuillez sélectionner une date de signature");
      return;
    }

    try {
      await contractorSignContract.mutateAsync({
        contractId: contract.id,
        signatureDate: new Date(signatureDate),
      });
      setShowSignModal(false);
      onSuccess?.();
    } catch (error) {
      console.error("[ContractorSignatureSection] Error:", error);
    }
  };

  /**
   * Formate la date
   */
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <Card className={isAlreadySigned ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Signature du Contractor
          </CardTitle>
          <CardDescription>
            {isAlreadySigned
              ? "Vous avez déjà signé ce contrat"
              : "Vous devez signer ce contrat pour le valider"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations du contrat */}
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Titre du contrat</p>
              <p className="font-medium">{contract.title || "Contrat NORM"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date de début
                </p>
                <p className="font-medium">{formatDate(contract.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date de fin
                </p>
                <p className="font-medium">{formatDate(contract.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Statut de signature */}
          {isAlreadySigned ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Contrat signé le {formatDate(contract.contractorSignedAt)}</strong>
                <br />
                Votre signature a été enregistrée avec succès.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-orange-200">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  En signant ce contrat, vous acceptez tous les termes et conditions mentionnés dans le document.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setShowSignModal(true)}
                className="w-full"
                size="lg"
              >
                <FileSignature className="mr-2 h-5 w-5" />
                Signer le contrat
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de confirmation */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Confirmer la signature
            </DialogTitle>
            <DialogDescription>
              Veuillez confirmer que vous souhaitez signer ce contrat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informations du contrat */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg border bg-muted/50">
                <p className="text-sm text-muted-foreground">Contrat</p>
                <p className="font-semibold">{contract.title || "Contrat NORM"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-xs text-muted-foreground">Début</p>
                  <p className="text-sm font-medium">{formatDate(contract.startDate)}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-xs text-muted-foreground">Fin</p>
                  <p className="text-sm font-medium">{formatDate(contract.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Date de signature */}
            <div className="space-y-2">
              <Label htmlFor="signature-date" className="required">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date de signature *
              </Label>
              <Input
                id="signature-date"
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                disabled={isSigning}
                max={new Date().toISOString().split("T")[0]} // Pas de date future
              />
              <p className="text-xs text-muted-foreground">
                Par défaut, la date du jour est sélectionnée
              </p>
            </div>

            {/* Avertissement */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Important :</strong> Cette action est définitive. En signant, vous confirmez avoir lu et accepté
                tous les termes du contrat.
              </AlertDescription>
            </Alert>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSignModal(false)}
              disabled={isSigning}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSign}
              disabled={isSigning || !signatureDate}
            >
              {isSigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signature en cours...
                </>
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Confirmer la signature
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
