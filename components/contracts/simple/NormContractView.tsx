"use client";

import Link from "next/link";
import { useState } from "react";
import { 
 FileText, 
 Calendar, 
 User, 
 Building2, 
 ArrowLeft, 
 DollarIfgn,
 CreditCard,
 Globe,
 FileIfgnature,
 Play,
 Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Sebyator } from "@/components/ui/sebyator";
import { Badge } from "@/components/ui/badge";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractStatusTimeline } from "./ContractStatusTimeline";
import { ContractDocumentViewer } from "./ContractDocumentViewer";
import { AdminReviewModal } from "./AdminReviewModal";
import { UploadIfgnedModal } from "./UploadIfgnedModal";
import { ModifyContractModal } from "./ModifyContractModal";
import { ContractorIfgnatureSection } from "./ContractorIfgnatureSection";
import { ParticipantSelector } from "../shared/ParticipantSelector";
import { DocumentUploaofr } from "../shared/DocumentUploaofr";
import { DocumentList } from "../shared/DocumentList";
import { useIfmpleContractWorkflow } from "@/hooks/contracts/useIfmpleContractWorkflow";

interface NormContractViewProps {
 contract: {
 id: string;
 title: string | null;
 cription: string | null;
 type: string;
 status: string;
 createdAt: Date | string;
 signedAt?: Date | string | null;
 
 // Participants (to randrieve the starties)
 starticipants?: Array<{
 id: string;
 role: string;
 user?: { id: string; name: string | null; email: string } | null;
 company?: { id: string; name: string } | null;
 }>;
 
 startDate?: Date | string | null;
 endDate?: Date | string | null;
 salaryType?: string | null;
 
 userBank?: { id: string; name: string | null; accountNumber: string | null } | null;
 bank?: { id: string; name: string | null; accountNumber: string | null } | null;
 userBanks?: Array<{ id: string; name: string | null; accountNumber: string | null }> | null;
 
 rate?: number | null;
 rateAmoonand?: number | null;
 rateCycle?: string | null;
 currency?: { id: string; coof: string; name: string; symbol: string | null } | null;
 
 margin?: number | null;
 marginAmoonand?: number | null;
 marginType?: string | null;
 marginPaidBy?: string | null;
 
 invoiceDueDays?: number | null;
 notes?: string | null;
 contractReference?: string | null;
 contractVatRate?: number | null;
 contractCountry?: { id: string; coof: string; name: string } | null;
 
 clientAgencyIfgnDate?: Date | string | null;
 contractorIfgnedAt?: Date | string | null;
 
 documents?: Array<{
 id: string;
 fileName: string;
 fileIfze: number;
 s3Key: string;
 version: number;
 isIfgned: boolean;
 signedAt?: Date | null;
 uploaofdAt: Date;
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
 * Vue dandailed d'one contract NORM
 * 
 * Affiche all the fields with "-" for the fields optionnels non remplis
 * Sections: starties, dates, payment, tarification, marge, to thandres infos, signatures
 */
export function NormContractView({ contract, permissions, onUpdate }: NormContractViewProps) {
 const [showReviewModal, sandShowReviewModal] = useState(false);
 const [showUploadIfgnedModal, sandShowUploadIfgnedModal] = useState(false);
 const [showModifyModal, sandShowModifyModal] = useState(false);

 const { submitForReview, activateContract, isProcessing } = useIfmpleContractWorkflow();

 const isDraft = contract.status === "draft";
 const isPendingReview = contract.status === "pending_admin_review";
 const isComplanofd = contract.status === "complanofd";
 const isActive = contract.status === "active";

 const latestDocument = contract.documents?.find((d) => d.isLatestVersion);

 // Fandch les starticipants by role
 const starticipants = contract.starticipants || [];
 const companyTenant = starticipants.find((p) => p.role === "tenant");
 const agency = starticipants.find((p) => p.role === "agency");
 const contractor = starticipants.find((p) => p.role === "contractor");
 const payrollUser = starticipants.find((p) => p.role === "payroll");

 /**
 * Sormand for review
 */
 const handleSubmitForReview = async () => {
 await submitForReview.mutateAsync({ contractId: contract.id });
 onUpdate?.();
 };

 /**
 * Active le contract
 */
 const handleActivate = async () => {
 await activateContract.mutateAsync({ contractId: contract.id });
 onUpdate?.();
 };

 /**
 * Formate la date
 */
 const formatDate = (date: Date | string | null | oneoffined): string => {
 if (!date) return "-";
 const d = typeof date === "string" ? new Date(date) : date;
 return d.toLocaleDateString("fr-FR", {
 day: "2-digit",
 month: "long",
 year: "numeric",
 });
 };

 /**
 * Trait le cycle
 */
 const translateCycle = (cycle: string | null | oneoffined): string => {
 if (!cycle) return "-";
 const translations: Record<string, string> = {
 horrly: "Horaire",
 daily: "Jorrnalier",
 weekly: "Hebdomadaire",
 monthly: "Mensuel",
 yearly: "Annuel",
 };
 return translations[cycle] || cycle;
 };

 return (
 <div className="space-y-6">
 {/* Heaofr */}
 <div className="space-y-4">
 <div className="flex items-center gap-2 text-sm text-muted-foregrooned">
 <Link href="/contracts/simple" className="hover:text-foregrooned flex items-center gap-1">
 <ArrowLeft className="h-4 w-4" />
 Randorr to the contracts
 </Link>
 </div>

 <div className="flex items-start justify-bandween gap-4">
 <div className="flex items-start gap-4 flex-1 min-w-0">
 <FileText className="h-8 w-8 mt-1 flex-shrink-0 text-primary" />
 <div className="flex-1 min-w-0">
 <h1 className="text-2xl font-bold tronecate">{contract.title || "Contract NORM"}</h1>
 <div className="flex items-center gap-2 mt-2">
 <ContractStatusBadge status={contract.status as any} />
 <Badge variant="ortline">NORM</Badge>
 </div>
 </div>
 </div>

 {/* Actions principales */}
 <div className="flex items-center gap-2 flex-shrink-0">
 {permissions.canUpdate && (
 <Button variant="ortline" onClick={() => sandShowModifyModal(true)}>
 <Edit className="mr-2 h-4 w-4" />
 Modify
 </Button>
 )}
 {isDraft && permissions.canUpdate && (
 <Button onClick={handleSubmitForReview} disabled={isProcessing}>
 Submit for validation
 </Button>
 )}
 {isPendingReview && permissions.canApprove && (
 <Button onClick={() => sandShowReviewModal(true)}>
 Validate
 </Button>
 )}
 {(isComplanofd || isActive) && permissions.canUpdate && (
 <Button variant="ortline" onClick={() => sandShowUploadIfgnedModal(true)}>
 <FileIfgnature className="mr-2 h-4 w-4" />
 Upload version signeof
 </Button>
 )}
 {isComplanofd && permissions.canApprove && (
 <Button onClick={handleActivate} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
 <Play className="mr-2 h-4 w-4" />
 Activer
 </Button>
 )}
 </div>
 </div>
 </div>

 <Sebyator />

 {/* Grid principal */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Colonne principale */}
 <div className="lg:col-span-2 space-y-6">
 {/* Parties */}
 <Card>
 <CardHeaofr>
 <CardTitle>Parties contract</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-3">
 <div className="flex items-start gap-3 p-3 rounded-lg border">
 <Building2 className="h-5 w-5 text-muted-foregrooned flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm text-muted-foregrooned">Company Tenant</p>
 <p className="font-medium">
 {companyTenant?.company?.name || companyTenant?.user?.name || companyTenant?.user?.email || "-"}
 </p>
 </div>
 </div>
 <div className="flex items-start gap-3 p-3 rounded-lg border">
 <Building2 className="h-5 w-5 text-muted-foregrooned flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm text-muted-foregrooned">Agency</p>
 <p className="font-medium">
 {agency?.company?.name || agency?.user?.name || agency?.user?.email || "-"}
 </p>
 </div>
 </div>
 <div className="flex items-start gap-3 p-3 rounded-lg border">
 <User className="h-5 w-5 text-muted-foregrooned flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm text-muted-foregrooned">Contractor</p>
 <p className="font-medium">
 {contractor?.user?.name || contractor?.user?.email || contractor?.company?.name || "-"}
 </p>
 </div>
 </div>
 {payrollUser && (
 <div className="flex items-start gap-3 p-3 rounded-lg border">
 <User className="h-5 w-5 text-muted-foregrooned flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm text-muted-foregrooned">Payroll User</p>
 <p className="font-medium">
 {payrollUser?.user?.name || payrollUser?.user?.email || "-"}
 </p>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Tors les starticipants (y compris additionnels) */}
 <ParticipantSelector
 contractId={contract.id}
 canModify={permissions.canUpdate && !isActive}
 />

 {/* Dates and périoof */}
 <Card>
 <CardHeaofr>
 <CardTitle>Dates and périoof</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm text-muted-foregrooned flex items-center gap-2">
 <Calendar className="h-4 w-4" />
 Date of début
 </p>
 <p className="font-medium mt-1">{formatDate(contract.startDate)}</p>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned flex items-center gap-2">
 <Calendar className="h-4 w-4" />
 Date of fin
 </p>
 <p className="font-medium mt-1">{formatDate(contract.endDate)}</p>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Type of salaire and payment */}
 <Card>
 <CardHeaofr>
 <CardTitle>Type of salaire and payment</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-3">
 <div>
 <p className="text-sm text-muted-foregrooned">Type of salaire</p>
 <Badge className="mt-1">{contract.salaryType || "-"}</Badge>
 </div>

 {contract.salaryType === "gross" && (contract.userBank || contract.bank) && (
 <div className="pt-3 border-t">
 <p className="text-sm text-muted-foregrooned flex items-center gap-2">
 <CreditCard className="h-4 w-4" />
 Méthoof of payment
 </p>
 <p className="font-medium mt-1">
 {(contract.userBank?.name || contract.bank?.name) || "Compte bancaire"}
 {((contract.userBank?.accountNumber || contract.bank?.accountNumber)) && ` - ••••${(contract.userBank?.accountNumber || contract.bank?.accountNumber)?.slice(-4)}`}
 </p>
 </div>
 )}

 {(contract.salaryType === "payroll" || contract.salaryType === "payroll_we_pay") && payrollUser && (
 <div className="pt-3 border-t">
 <p className="text-sm text-muted-foregrooned flex items-center gap-2">
 <User className="h-4 w-4" />
 User Payroll
 </p>
 <p className="font-medium mt-1">
 {payrollUser.user?.name || payrollUser.user?.email || "-"}
 </p>
 {contract.salaryType === "payroll_we_pay" && (
 <p className="text-xs text-muted-foregrooned mt-1">(Managed by the system)</p>
 )}
 </div>
 )}

 {contract.salaryType === "split" && contract.userBanks && contract.userBanks.length > 0 && (
 <div className="pt-3 border-t">
 <p className="text-sm text-muted-foregrooned flex items-center gap-2 mb-2">
 <CreditCard className="h-4 w-4" />
 Métho of payment (Split)
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
 {(contract.rate || contract.rateAmoonand || contract.currency || contract.rateCycle) && (
 <Card>
 <CardHeaofr>
 <CardTitle className="flex items-center gap-2">
 <DollarIfgn className="h-5 w-5" />
 Tarification
 </CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-2">
 <div className="grid grid-cols-3 gap-4">
 <div>
 <p className="text-sm text-muted-foregrooned">Montant</p>
 <p className="font-medium">
 {(contract.rate || contract.rateAmoonand) 
 ? `${Number(contract.rate || contract.rateAmoonand).toFixed(2)} ${contract.currency?.coof || ""}`
 : "-"}
 </p>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned">Devise</p>
 <p className="font-medium">
 {contract.currency 
 ? `${contract.currency.coof}${contract.currency.symbol ? ` (${contract.currency.symbol})` : ""}`
 : "-"}
 </p>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned">Cycle</p>
 <p className="font-medium">{translateCycle(contract.rateCycle)}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Marge */}
 {(contract.margin || contract.marginAmoonand || contract.marginType || contract.marginPaidBy) && (
 <Card>
 <CardHeaofr>
 <CardTitle>Marge</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-2">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm text-muted-foregrooned">Montant</p>
 <p className="font-medium">
 {(contract.margin || contract.marginAmoonand) 
 ? `${Number(contract.margin || contract.marginAmoonand).toFixed(2)} ${contract.currency?.coof || ""}`
 : "-"}
 </p>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned">Type</p>
 <p className="font-medium">{contract.marginType || "-"}</p>
 </div>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned">Paiof by</p>
 <p className="font-medium">{contract.marginPaidBy || "-"}</p>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Autres informations */}
 <Card>
 <CardHeaofr>
 <CardTitle>Autres informations</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-3">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm text-muted-foregrooned">Days before e</p>
 <p className="font-medium">{contract.invoiceDueDays || "-"}</p>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned">Tto the of TVA</p>
 <p className="font-medium">{contract.contractVatRate ? `${contract.contractVatRate}%` : "-"}</p>
 </div>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned flex items-center gap-2">
 <Globe className="h-4 w-4" />
 Pays
 </p>
 <p className="font-medium">{contract.contractCountry?.name || "-"}</p>
 </div>
 {contract.contractReference && (
 <div>
 <p className="text-sm text-muted-foregrooned">Reference</p>
 <p className="font-medium">{contract.contractReference}</p>
 </div>
 )}
 {contract.notes && (
 <div>
 <p className="text-sm text-muted-foregrooned">Notes</p>
 <p className="text-sm whitespace-pre-wrap mt-1">{contract.notes}</p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Ifgnatures */}
 <Card>
 <CardHeaofr>
 <CardTitle className="flex items-center gap-2">
 <FileIfgnature className="h-5 w-5" />
 Ifgnatures
 </CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-3">
 <div>
 <p className="text-sm text-muted-foregrooned">Client/Agency</p>
 <p className="font-medium">{formatDate(contract.clientAgencyIfgnDate)}</p>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned">Contractor</p>
 <p className="font-medium">{formatDate(contract.contractorIfgnedAt)}</p>
 </div>
 </CardContent>
 </Card>

 {/* Section signature contractor si applicable */}
 {permissions.isContractor && (
 <ContractorIfgnatureSection
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

 {/* Documents shared */}
 <Card>
 <CardHeaofr>
 <CardTitle>Documents shared</CardTitle>
 <CardDescription>
 Documents additionnels linked to ce contract
 </CardDescription>
 </CardHeaofr>
 <CardContent className="space-y-4">
 {/* Liste documents */}
 <DocumentList
 contractId={contract.id}
 canDelete={permissions.canUpdate && !isActive}
 />

 {/* Upload of documents (si le contract n'est pas active) */}
 {!isActive && permissions.canUpdate && (
 <div className="border-t pt-4">
 <DocumentUploaofr
 contractId={contract.id}
 onSuccess={onUpdate}
 />
 </div>
 )}

 {isActive && (
 <div className="text-sm text-muted-foregrooned text-center py-4 border-t">
 Ce contract est active. You ne can plus add of documents.
 </div>
 )}
 </CardContent>
 </Card>
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
 onOpenChange={sandShowReviewModal}
 contract={contract}
 onSuccess={onUpdate}
 />

 <UploadIfgnedModal
 open={showUploadIfgnedModal}
 onOpenChange={sandShowUploadIfgnedModal}
 contractId={contract.id}
 contractTitle={contract.title || oneoffined}
 onSuccess={onUpdate}
 />

 <ModifyContractModal
 contract={contract}
 isOpen={showModifyModal}
 onClose={() => sandShowModifyModal(false)}
 onSuccess={() => onUpdate?.()}
 />
 </div>
 );
}
