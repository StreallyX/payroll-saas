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
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractStatusTimeline } from "./ContractStatusTimeline";
import { ContractDocumentViewer } from "./ContractDocumentViewer";
import { AdminReviewModal } from "./AdminReviewModal";
import { UploadSignedModal } from "./UploadSignedModal";
import { ModifyContractModal } from "./ModifyContractModal";
import { ContractorSignatureSection } from "./ContractorSignatureSection";
import { ParticipantSelector } from "../shared/ParticipantSelector";
import { DocumentUploader } from "../shared/DocumentUploader";
import { DocumentList } from "../shared/DocumentList";
import { useSimpleContractWorkflow } from "@/hooks/contracts/useSimpleContractWorkflow";

interface NormContractViewProps {
  contract: {
    id: string;
    title: string | null;
    description: string | null;
    type: string;
    status: string;
    createdAt: Date | string;
    signedAt?: Date | string | null;

    // Participants (used to determine parties)
    participants?: Array<{
      id: string;
      role: string;
      user?: { id: string; name: string | null; email: string } | null;
      company?: { id: string; name: string } | null;
    }>;

    startDate?: Date | string | null;
    endDate?: Date | string | null;
    salaryType?: string | null;

    userBank?: {
      id: string;
      name: string | null;
      accountNumber: string | null;
    } | null;
    bank?: {
      id: string;
      name: string | null;
      accountNumber: string | null;
    } | null;
    userBanks?: Array<{
      id: string;
      name: string | null;
      accountNumber: string | null;
    }> | null;

    rate?: number | null;
    rateAmount?: number | null;
    rateCycle?: string | null;
    currency?: {
      id: string;
      code: string;
      name: string;
      symbol: string | null;
    } | null;

    margin?: number | null;
    marginAmount?: number | null;
    marginType?: string | null;
    marginPaidBy?: string | null;

    invoiceDueDays?: number | null;
    notes?: string | null;
    contractReference?: string | null;
    contractVatRate?: number | null;
    contractCountry?: {
      id: string;
      code: string;
      name: string;
    } | null;

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
 * Detailed view of a NORM contract
 *
 * Displays all fields, using "-" for optional fields that are not filled.
 * Sections: parties, dates, payment, pricing, margin, additional info, signatures
 */
export function NormContractView({
  contract,
  permissions,
  onUpdate,
}: NormContractViewProps) {
  const [showReviewModal, setShowReviewModal] =
    useState(false);
  const [showUploadSignedModal, setShowUploadSignedModal] =
    useState(false);
  const [showModifyModal, setShowModifyModal] =
    useState(false);

  const {
    submitForReview,
    activateContract,
    isProcessing,
  } = useSimpleContractWorkflow();

  const isDraft = contract.status === "draft";
  const isPendingReview =
    contract.status === "pending_admin_review";
  const isCompleted = contract.status === "completed";
  const isActive = contract.status === "active";

  const latestDocument = contract.documents?.find(
    (d) => d.isLatestVersion
  );

  // Get participants by role
  const participants = contract.participants || [];
  const companyTenant = participants.find(
    (p) => p.role === "tenant"
  );
  const agency = participants.find(
    (p) => p.role === "agency"
  );
  const contractor = participants.find(
    (p) => p.role === "contractor"
  );
  const payrollPartner = participants.find(
    (p) => p.role === "payroll"
  );

  /**
   * Submit contract for admin review
   */
  const handleSubmitForReview = async () => {
    await submitForReview.mutateAsync({
      contractId: contract.id,
    });
    onUpdate?.();
  };

  /**
   * Activate the contract
   */
  const handleActivate = async () => {
    await activateContract.mutateAsync({
      contractId: contract.id,
    });
    onUpdate?.();
  };

  /**
   * Format date
   */
  const formatDate = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "-";
    const d =
      typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * Translate rate cycle
   */
  const translateCycle = (
    cycle: string | null | undefined
  ): string => {
    if (!cycle) return "-";
    const translations: Record<string, string> = {
      hourly: "Hourly",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
    };
    return translations[cycle] || cycle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/contracts/simple"
            className="hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to contracts
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <FileText className="h-8 w-8 mt-1 flex-shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">
                {contract.title || "NORM Contract"}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <ContractStatusBadge
                  status={contract.status as any}
                />
                <Badge variant="outline">NORM</Badge>
              </div>
            </div>
          </div>

          {/* Primary actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {permissions.canUpdate && (
              <Button
                variant="outline"
                onClick={() =>
                  setShowModifyModal(true)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}

            {isDraft && permissions.canUpdate && (
              <Button
                onClick={handleSubmitForReview}
                disabled={isProcessing}
              >
                Submit for review
              </Button>
            )}

            {isPendingReview &&
              permissions.canApprove && (
                <Button
                  onClick={() =>
                    setShowReviewModal(true)
                  }
                >
                  Approve
                </Button>
              )}

            {(isCompleted || isActive) &&
              permissions.canUpdate && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setShowUploadSignedModal(true)
                  }
                >
                  <FileSignature className="mr-2 h-4 w-4" />
                  Upload signed version
                </Button>
              )}

            {isCompleted &&
              permissions.canApprove && (
                <Button
                  onClick={handleActivate}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Activate
                </Button>
              )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Contract parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Tenant company
                  </p>
                  <p className="font-medium">
                    {companyTenant?.company?.name ||
                      companyTenant?.user?.name ||
                      companyTenant?.user?.email ||
                      "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Agency
                  </p>
                  <p className="font-medium">
                    {agency?.company?.name ||
                      agency?.user?.name ||
                      agency?.user?.email ||
                      "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Contractor
                  </p>
                  <p className="font-medium">
                    {contractor?.user?.name ||
                      contractor?.user?.email ||
                      contractor?.company?.name ||
                      "-"}
                  </p>
                </div>
              </div>

              {payrollPartner && (
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Payroll Partner
                    </p>
                    <p className="font-medium">
                      {payrollPartner.company?.name ||
                        payrollPartner.user?.name ||
                        "-"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All participants (including additional ones) */}
          <ParticipantSelector
            contractId={contract.id}
            canModify={
              permissions.canUpdate && !isActive
            }
          />

          {/* Dates and period */}
          <Card>
            <CardHeader>
              <CardTitle>Dates and period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start date
                  </p>
                  <p className="font-medium mt-1">
                    {formatDate(contract.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End date
                  </p>
                  <p className="font-medium mt-1">
                    {formatDate(contract.endDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary type and payment */}
          <Card>
            <CardHeader>
              <CardTitle>Salary type and payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Salary type
                </p>
                <Badge className="mt-1">
                  {contract.salaryType || "-"}
                </Badge>
              </div>

              {contract.salaryType === "gross" &&
                (contract.userBank || contract.bank) && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment method
                    </p>
                    <p className="font-medium mt-1">
                      {(contract.userBank?.name ||
                        contract.bank?.name) ||
                        "Bank account"}
                      {(contract.userBank?.accountNumber ||
                        contract.bank?.accountNumber) &&
                        ` - ••••${
                          (
                            contract.userBank
                              ?.accountNumber ||
                            contract.bank?.accountNumber
                          )?.slice(-4)
                        }`}
                    </p>
                  </div>
                )}

              {(contract.salaryType === "payroll" ||
                contract.salaryType ===
                  "payroll_we_pay") &&
                payrollPartner && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Payroll Partner
                    </p>
                    <p className="font-medium mt-1">
                      {payrollPartner.company?.name ||
                        payrollPartner.user?.name ||
                        "-"}
                    </p>
                    {contract.salaryType ===
                      "payroll_we_pay" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (Managed by the system)
                      </p>
                    )}
                  </div>
                )}

              {contract.salaryType === "split" &&
                contract.userBanks &&
                contract.userBanks.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4" />
                      Payment methods (Split)
                    </p>
                    <div className="space-y-2">
                      {contract.userBanks.map((ub) => (
                        <div
                          key={ub.id}
                          className="text-sm p-2 rounded border"
                        >
                          {ub.name || "Bank account"}
                          {ub.accountNumber &&
                            ` - ••••${ub.accountNumber.slice(
                              -4
                            )}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Pricing */}
          {(contract.rate ||
            contract.rateAmount ||
            contract.currency ||
            contract.rateCycle) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Amount
                    </p>
                    <p className="font-medium">
                      {contract.rate ||
                      contract.rateAmount
                        ? `${Number(
                            contract.rate ||
                              contract.rateAmount
                          ).toFixed(2)} ${
                            contract.currency?.code || ""
                          }`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Currency
                    </p>
                    <p className="font-medium">
                      {contract.currency
                        ? `${contract.currency.code}${
                            contract.currency.symbol
                              ? ` (${contract.currency.symbol})`
                              : ""
                          }`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Cycle
                    </p>
                    <p className="font-medium">
                      {translateCycle(contract.rateCycle)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Margin */}
          {(contract.margin ||
            contract.marginAmount ||
            contract.marginType ||
            contract.marginPaidBy) && (
            <Card>
              <CardHeader>
                <CardTitle>Margin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Amount
                    </p>
                    <p className="font-medium">
                      {contract.margin ||
                      contract.marginAmount
                        ? `${Number(
                            contract.margin ||
                              contract.marginAmount
                          ).toFixed(2)} ${
                            contract.currency?.code || ""
                          }`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Type
                    </p>
                    <p className="font-medium">
                      {contract.marginType || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Paid by
                  </p>
                  <p className="font-medium">
                    {contract.marginPaidBy || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Invoice due days
                  </p>
                  <p className="font-medium">
                    {contract.invoiceDueDays || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    VAT rate
                  </p>
                  <p className="font-medium">
                    {contract.contractVatRate
                      ? `${contract.contractVatRate}%`
                      : "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Country
                </p>
                <p className="font-medium">
                  {contract.contractCountry?.name ||
                    "-"}
                </p>
              </div>
              {contract.contractReference && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Reference
                  </p>
                  <p className="font-medium">
                    {contract.contractReference}
                  </p>
                </div>
              )}
              {contract.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap mt-1">
                    {contract.notes}
                  </p>
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
                <p className="text-sm text-muted-foreground">
                  Client / Agency
                </p>
                <p className="font-medium">
                  {formatDate(contract.clientAgencySignDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Contractor
                </p>
                <p className="font-medium">
                  {formatDate(contract.contractorSignedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contractor signature section (if applicable) */}
          {permissions.isContractor && (
            <ContractorSignatureSection
              contract={contract}
              onSuccess={onUpdate}
            />
          )}

          {/* Main document */}
          {latestDocument && (
            <ContractDocumentViewer
              document={latestDocument}
              onDownload={() => {
                console.log(
                  "Download document:",
                  latestDocument.id
                );
              }}
            />
          )}

          {/* Shared documents */}
          <Card>
            <CardHeader>
              <CardTitle>Shared documents</CardTitle>
              <CardDescription>
                Additional documents linked to this contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentList
                contractId={contract.id}
                canDelete={
                  permissions.canUpdate && !isActive
                }
              />

              {!isActive && permissions.canUpdate && (
                <div className="border-t pt-4">
                  <DocumentUploader
                    contractId={contract.id}
                    onSuccess={onUpdate}
                  />
                </div>
              )}

              {isActive && (
                <div className="text-sm text-muted-foreground text-center py-4 border-t">
                  This contract is active. You can no longer
                  add documents.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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

      <ModifyContractModal
        contract={contract}
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        onSuccess={() => onUpdate?.()}
      />
    </div>
  );
}
