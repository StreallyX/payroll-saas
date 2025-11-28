"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  ArrowLeft, 
  Send, 
  CheckCircle,
  FileSignature,
  Play,
  Edit,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractStatusTimeline } from "./ContractStatusTimeline";
import { ContractDocumentViewer } from "./ContractDocumentViewer";
import { AdminReviewModal } from "./AdminReviewModal";
import { UploadSignedModal } from "./UploadSignedModal";
import { useSimpleContractWorkflow } from "@/hooks/contracts/useSimpleContractWorkflow";

interface MinimalContractViewProps {
  contract: {
    id: string;
    title: string | null;
    description: string | null;
    type: string;
    status: string;
    createdAt: Date | string;
    signedAt?: Date | string | null;
    parent?: {
      id: string;
      title: string | null;
      type: string;
    } | null;
    children?: Array<{
      id: string;
      title: string | null;
      status: string;
    }>;
    participants?: Array<{
      id: string;
      role: string;
      user?: {
        id: string;
        name: string | null;
        email: string;
      } | null;
      company?: {
        id: string;
        name: string;
      } | null;
    }>;
    documents?: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      s3Key: string;
      version: number;
      isSigned: boolean;
      signedAt?: Date | null;
      uploadedAt: Date;
      isLatestVersion: boolean;
    }>;
    statusHistory?: Array<{
      id: string;
      fromStatus: string;
      toStatus: string;
      createdAt: Date | string;
      reason?: string | null;
      notes?: string | null;
      changedByUser?: {
        name: string | null;
        email: string;
      } | null;
    }>;
  };
  permissions: {
    canUpdate: boolean;
    canApprove: boolean;
    canDelete: boolean;
  };
  onUpdate?: () => void;
}

/**
 * Vue détaillée d'un contrat simplifié
 * 
 * Sections:
 * - Header (titre, statut, actions)
 * - Informations générales
 * - Document principal
 * - Participants
 * - Timeline du workflow
 * - Contrats liés (MSA parent ou SOWs enfants)
 */
export function MinimalContractView({ contract, permissions, onUpdate }: MinimalContractViewProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUploadSignedModal, setShowUploadSignedModal] = useState(false);

  const { submitForReview, activateContract, isProcessing } = useSimpleContractWorkflow();

  const isMSA = contract.type === "msa";
  const isDraft = contract.status === "draft";
  const isPendingReview = contract.status === "pending_admin_review";
  const isCompleted = contract.status === "completed";
  const isActive = contract.status === "active";

  const latestDocument = contract.documents?.find((d) => d.isLatestVersion);
  const childrenCount = contract.children?.length || 0;

  /**
   * Soumet pour review
   */
  const handleSubmitForReview = async () => {
    await submitForReview.mutateAsync({ contractId: contract.id });
    onUpdate?.();
  };

  /**
   * Active le contrat
   */
  const handleActivate = async () => {
    await activateContract.mutateAsync({ contractId: contract.id });
    onUpdate?.();
  };

  /**
   * Formate la date
   */
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/contracts/simple" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Retour aux contrats
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <FileText className={`h-8 w-8 mt-1 flex-shrink-0 ${isMSA ? "text-primary" : "text-blue-600"}`} />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{contract.title || "Sans titre"}</h1>
              <div className="flex items-center gap-2 mt-2">
                <ContractStatusBadge status={contract.status as any} />
                <span className="text-sm text-muted-foreground">
                  {isMSA ? "Master Service Agreement" : "Statement of Work"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions principales */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isDraft && permissions.canUpdate && (
              <Button onClick={handleSubmitForReview} disabled={isProcessing}>
                <Send className="mr-2 h-4 w-4" />
                Soumettre pour validation
              </Button>
            )}
            {isPendingReview && permissions.canApprove && (
              <Button onClick={() => setShowReviewModal(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Valider
              </Button>
            )}
            {(isCompleted || isActive) && permissions.canUpdate && (
              <Button variant="outline" onClick={() => setShowUploadSignedModal(true)}>
                <FileSignature className="mr-2 h-4 w-4" />
                Upload version signée
              </Button>
            )}
            {isCompleted && permissions.canApprove && (
              <Button onClick={handleActivate} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                <Play className="mr-2 h-4 w-4" />
                Activer
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de création
                  </p>
                  <p className="font-medium mt-1">{formatDate(contract.createdAt)}</p>
                </div>
                {contract.signedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileSignature className="h-4 w-4" />
                      Date de signature
                    </p>
                    <p className="font-medium mt-1">{formatDate(contract.signedAt)}</p>
                  </div>
                )}
              </div>

              {contract.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{contract.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document principal */}
          {latestDocument && (
            <ContractDocumentViewer
              document={latestDocument}
              onDownload={() => {
                console.log("Download document:", latestDocument.id);
              }}
            />
          )}

          {/* Participants */}
          {contract.participants && contract.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>
                  Utilisateurs et entreprises impliqués dans ce contrat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contract.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      {participant.user ? (
                        <>
                          <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {participant.user.name || participant.user.email}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {participant.role}
                            </p>
                          </div>
                        </>
                      ) : participant.company ? (
                        <>
                          <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{participant.company.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {participant.role}
                            </p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Timeline */}
          <ContractStatusTimeline
            currentStatus={contract.status as any}
            statusHistory={contract.statusHistory}
          />

          {/* MSA parent (si SOW) */}
          {!isMSA && contract.parent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  MSA Parent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/contracts/simple/${contract.parent.id}`}
                  className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium">{contract.parent.title || "Sans titre"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Voir le MSA →</p>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* SOWs enfants (si MSA) */}
          {isMSA && childrenCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SOWs liés ({childrenCount})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contract.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={`/contracts/simple/${child.id}`}
                      className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-sm truncate">{child.title || "Sans titre"}</p>
                      <div className="mt-1">
                        <ContractStatusBadge status={child.status as any} />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <AdminReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        contract={contract}
        onSuccess={onUpdate}
      />

      <UploadSignedModal
        open={showUploadSignedModal}
        onOpenChange={setShowUploadSignedModal}
        contractId={contract.id}
        contractTitle={contract.title || undefined}
        onSuccess={onUpdate}
      />
    </div>
  );
}
