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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, Users, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared/loading-state";
import { DocumentListView } from "@/components/documents/DocumentListView";

interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onSuccess?: () => void;
}

export function ApprovalModal({
  open,
  onOpenChange,
  contractId,
  onSuccess,
}: ApprovalModalProps) {
  const [comments, setComments] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const { data: contract, isLoading } = api.contract.getById.useQuery(
    { id: contractId },
    { enabled: open }
  );

  const approveMutation = api.contract.approveByApprover.useMutation();

  async function handleApprove() {
    setIsApproving(true);

    try {
      await approveMutation.mutateAsync({
        contractId: contractId,
        comments: comments || undefined,
      });

      toast.success("Contrat approuvé avec succès !");
      setComments("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Échec de l'approbation");
    } finally {
      setIsApproving(false);
    }
  }

  const fmtDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Approbation du contrat
          </DialogTitle>
          <DialogDescription>
            Examinez les informations du contrat et approuvez-le pour qu'il puisse passer à l'étape suivante.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState message="Chargement des détails..." />
        ) : !contract ? (
          <p className="text-center py-6 text-muted-foreground">Contrat introuvable</p>
        ) : (
          <div className="space-y-4">
            {/* Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Informations du contrat
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Titre</p>
                  <p className="font-medium">{contract.title || "Sans titre"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge>{contract.type?.toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <Badge variant="secondary">{contract.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date de début</p>
                  <p className="font-medium">{fmtDate(contract.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date de fin</p>
                  <p className="font-medium">{fmtDate(contract.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entreprise</p>
                  <p className="font-medium">{contract.company?.name || "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-purple-600" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contract.participants?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{p.user?.name || p.userId}</p>
                        <p className="text-xs text-muted-foreground">
                          Rôle: {p.role} {p.requiresSignature && "• Signature requise"}
                        </p>
                      </div>
                      {p.signedAt && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {p.role === "approver" ? "Approuvé" : "Signé"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Documents attachés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentListView entityType="contract" entityId={contractId} />
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Commentaires (optionnel)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Ajoutez des commentaires sur votre approbation..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Attention</p>
                <p className="text-yellow-700">
                  En approuvant ce contrat, vous confirmez avoir examiné tous les documents et informations.
                  Le contrat passera à l'étape suivante du workflow.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApproving}>
            Annuler
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={isApproving || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApproving ? "Approbation en cours..." : "Approuver le contrat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
