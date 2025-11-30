"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  ArrowLeft, 
  DollarSign,
  CreditCard,
  Globe,
  FileSignature,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractStatusTimeline } from "./ContractStatusTimeline";
import { ContractDocumentViewer } from "./ContractDocumentViewer";
import { AdminReviewModal } from "./AdminReviewModal";
import { UploadSignedModal } from "./UploadSignedModal";
import { ContractorSignatureSection } from "./ContractorSignatureSection";
import { useSimpleContractWorkflow } from "@/hooks/contracts/useSimpleContractWorkflow";

interface NormContractViewProps {
  contract: {
    id: string;
    title: string | null;
    type: string;
    status: string;
    createdAt: Date | string;
    signedAt?: Date | string | null;
    
    // Participants (pour récupérer les parties)
    participants?: Array<{
      id: string;
      role: string;
      user?: { id: string; name: string | null; email: string } | null;
      company?: { id: string; name: string } | null;
    }>;
    
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    salaryType?: string | null;
    
    userBank?: { id: string; name: string | null; accountNumber: string | null } | null;
    userBanks?: Array<{ id: string; name: string | null; accountNumber: string | null }> | null;
    
    rateAmount?: number | null;
    rateCurrency?: string | null;
    rateCycle?: string | null;
    
    marginAmount?: number | null;
    marginCurrency?: string | null;
    marginType?: string | null;
    marginPaidBy?: string | null;
    
    invoiceDueDays?: number | null;
    notes?: string | null;
    contractReference?: string | null;
    contractVatRate?: number | null;
    contractCountry?: { id: string; name: string } | null;
    
    clientAgencySignDate?: Date | string | null;
    contractorSignedAt?: Date | string | null;
    
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
    isContractor: boolean;
  };
  onUpdate?: () => void;
}

/**
 * Vue détaillée d'un contrat NORM
 * 
 * Affiche tous les champs avec "-" pour les champs optionnels non remplis
 * Sections: parties, dates, paiement, tarification, marge, autres infos, signatures
 */
export function NormContractView({ contract, permissions, onUpdate }: NormContractViewProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUploadSignedModal, setShowUploadSignedModal] = useState(false);

  const { submitForReview, activateContract, isProcessing } = useSimpleContractWorkflow();

  const isDraft = contract.status === "draft";
  const isPendingReview = contract.status === "pending_admin_review";
  const isCompleted = contract.status === "completed";
  const isActive = contract.status === "active";

  const latestDocument = contract.documents?.find((d) => d.isLatestVersion);

  // Récupérer les participants par rôle
  const participants = contract.participants || [];
  const companyTenant = participants.find((p) => p.role === "tenant");
  const agency = participants.find((p) => p.role === "agency");
  const contractor = participants.find((p) => p.role === "contractor");
  const payrollUser = participants.find((p) => p.role === "payroll");

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
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * Formate le montant
   */
  const formatAmount = (amount: number | null | undefined, currency: string | null | undefined): string => {
    if (!amount) return "-";
    return `${amount.toFixed(2)} ${currency || ""}`;
  };

  /**
   * Traduit le cycle
   */
  const translateCycle = (cycle: string | null | undefined): string => {
    if (!cycle) return "-";
    const translations: Record<string, string> = {
      hourly: "Horaire",
      daily: "Journalier",
      weekly: "Hebdomadaire",
      monthly: "Mensuel",
      yearly: "Annuel",
    };
    return translations[cycle] || cycle;
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
            <FileText className="h-8 w-8 mt-1 flex-shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{contract.title || "Contrat NORM"}</h1>
              <div className="flex items-center gap-2 mt-2">
                <ContractStatusBadge status={contract.status as any} />
                <Badge variant="outline">NORM</Badge>
              </div>
            </div>
          </div>

          {/* Actions principales */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isDraft && permissions.canUpdate && (
              <Button onClick={handleSubmitForReview} disabled={isProcessing}>
                Soumettre pour validation
              </Button>
            )}
            {isPendingReview && permissions.canApprove && (
              <Button onClick={() => setShowReviewModal(true)}>
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
          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Parties du contrat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Company Tenant</p>
                  <p className="font-medium">
                    {companyTenant?.company?.name || companyTenant?.user?.name || companyTenant?.user?.email || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Agency</p>
                  <p className="font-medium">
                    {agency?.company?.name || agency?.user?.name || agency?.user?.email || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Contractor</p>
                  <p className="font-medium">
                    {contractor?.user?.name || contractor?.user?.email || contractor?.company?.name || "-"}
                  </p>
                </div>
              </div>
              {payrollUser && (
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Payroll User</p>
                    <p className="font-medium">
                      {payrollUser?.user?.name || payrollUser?.user?.email || "-"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates et période */}
          <Card>
            <CardHeader>
              <CardTitle>Dates et période</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de début
                  </p>
                  <p className="font-medium mt-1">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de fin
                  </p>
                  <p className="font-medium mt-1">{formatDate(contract.endDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Type de salaire et paiement */}
          <Card>
            <CardHeader>
              <CardTitle>Type de salaire et paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Type de salaire</p>
                <Badge className="mt-1">{contract.salaryType || "-"}</Badge>
              </div>

              {contract.salaryType === "gross" && contract.userBank && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Méthode de paiement
                  </p>
                  <p className="font-medium mt-1">
                    {contract.userBank.name || "Compte bancaire"}
                    {contract.userBank.accountNumber && ` - ••••${contract.userBank.accountNumber.slice(-4)}`}
                  </p>
                </div>
              )}

              {(contract.salaryType === "payroll" || contract.salaryType === "payroll_we_pay") && payrollUser && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Utilisateur Payroll
                  </p>
                  <p className="font-medium mt-1">
                    {payrollUser.user?.name || payrollUser.user?.email || "-"}
                  </p>
                  {contract.salaryType === "payroll_we_pay" && (
                    <p className="text-xs text-muted-foreground mt-1">(Géré par le système)</p>
                  )}
                </div>
              )}

              {contract.salaryType === "split" && contract.userBanks && contract.userBanks.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4" />
                    Méthodes de paiement (Split)
                  </p>
                  <div className="space-y-2">
                    {contract.userBanks.map((ub) => (
                      <div key={ub.id} className="text-sm p-2 rounded border">
                        {ub.name || "Compte bancaire"}
                        {ub.accountNumber && ` - ••••${ub.accountNumber.slice(-4)}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarification */}
          {(contract.rateAmount || contract.rateCurrency || contract.rateCycle) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tarification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="font-medium">{formatAmount(contract.rateAmount, contract.rateCurrency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Devise</p>
                    <p className="font-medium">{contract.rateCurrency || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cycle</p>
                    <p className="font-medium">{translateCycle(contract.rateCycle)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marge */}
          {(contract.marginAmount || contract.marginType || contract.marginPaidBy) && (
            <Card>
              <CardHeader>
                <CardTitle>Marge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="font-medium">{formatAmount(contract.marginAmount, contract.marginCurrency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{contract.marginType || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payée par</p>
                  <p className="font-medium">{contract.marginPaidBy || "-"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Autres informations */}
          <Card>
            <CardHeader>
              <CardTitle>Autres informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Jours avant échéance</p>
                  <p className="font-medium">{contract.invoiceDueDays || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taux de TVA</p>
                  <p className="font-medium">{contract.contractVatRate ? `${contract.contractVatRate}%` : "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Pays
                </p>
                <p className="font-medium">{contract.contractCountry?.name || "-"}</p>
              </div>
              {contract.contractReference && (
                <div>
                  <p className="text-sm text-muted-foreground">Référence</p>
                  <p className="font-medium">{contract.contractReference}</p>
                </div>
              )}
              {contract.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-wrap mt-1">{contract.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Signatures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Client/Agency</p>
                <p className="font-medium">{formatDate(contract.clientAgencySignDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contractor</p>
                <p className="font-medium">{formatDate(contract.contractorSignedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Section signature contractor si applicable */}
          {permissions.isContractor && (
            <ContractorSignatureSection
              contract={contract}
              onSuccess={onUpdate}
            />
          )}

          {/* Document principal */}
          {latestDocument && (
            <ContractDocumentViewer
              document={latestDocument}
              onDownload={() => {
                console.log("Download document:", latestDocument.id);
              }}
            />
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Timeline */}
          <ContractStatusTimeline
            currentStatus={contract.status as any}
            statusHistory={contract.statusHistory}
          />
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
