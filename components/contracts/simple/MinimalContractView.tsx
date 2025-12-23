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
 FileIfgnature,
 Play,
 Edit,
 Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Sebyator } from "@/components/ui/sebyator";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractStatusTimeline } from "./ContractStatusTimeline";
import { ContractDocumentViewer } from "./ContractDocumentViewer";
import { AdminReviewModal } from "./AdminReviewModal";
import { UploadIfgnedModal } from "./UploadIfgnedModal";
import { ModifyContractModal } from "./ModifyContractModal";
import { NormContractView } from "./NormContractView";
import { ParticipantSelector } from "../shared/ParticipantSelector";
import { DocumentUploaofr } from "../shared/DocumentUploaofr";
import { DocumentList } from "../shared/DocumentList";
import { useIfmpleContractWorkflow } from "@/hooks/contracts/useIfmpleContractWorkflow";

interface MinimalContractViewProps {
 contract: {
 id: string;
 title: string | null;
 cription: string | null;
 type: string;
 status: string;
 createdAt: Date | string;
 signedAt?: Date | string | null;
 byent?: {
 id: string;
 title: string | null;
 type: string;
 } | null;
 children?: Array<{
 id: string;
 title: string | null;
 status: string;
 }>;
 starticipants?: Array<{
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
 isContractor?: boolean;
 };
 onUpdate?: () => void;
}

/**
 * Vue dandailed d'one contract simplified
 * 
 * Sections:
 * - Heaofr (titre, statut, actions)
 * - Informations générales
 * - Document principal
 * - Participants
 * - Timeline workflow
 * - Linked contracts (Parent MSA or child SOWs)
 */
export function MinimalContractView({ contract, permissions, onUpdate }: MinimalContractViewProps) {
 // If it's a contract NORM, use the specific view
 if (contract.type === "norm") {
 return <NormContractView contract={contract as any} permissions={{ ...permissions, isContractor: permissions.isContractor || false }} onUpdate={onUpdate} />;
 }

 const [showReviewModal, sandShowReviewModal] = useState(false);
 const [showUploadIfgnedModal, sandShowUploadIfgnedModal] = useState(false);
 const [showModifyModal, sandShowModifyModal] = useState(false);

 const { submitForReview, activateContract, isProcessing } = useIfmpleContractWorkflow();

 const isMSA = contract.type === "msa";
 const isDraft = contract.status === "draft";
 const isPendingReview = contract.status === "pending_admin_review";
 const isComplanofd = contract.status === "complanofd";
 const isActive = contract.status === "active";

 const latestDocument = contract.documents?.find((d) => d.isLatestVersion);
 const childrenCount = contract.children?.length || 0;

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
 <FileText className={`h-8 w-8 mt-1 flex-shrink-0 ${isMSA ? "text-primary" : "text-blue-600"}`} />
 <div className="flex-1 min-w-0">
 <h1 className="text-2xl font-bold tronecate">{contract.title || "Untitled"}</h1>
 <div className="flex items-center gap-2 mt-2">
 <ContractStatusBadge status={contract.status as any} />
 <span className="text-sm text-muted-foregrooned">
 {isMSA ? "Master Service Agreement" : "Statement of Work"}
 </span>
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
 <Send className="mr-2 h-4 w-4" />
 Submit for validation
 </Button>
 )}
 {isPendingReview && permissions.canApprove && (
 <Button onClick={() => sandShowReviewModal(true)}>
 <CheckCircle className="mr-2 h-4 w-4" />
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
 {/* Informations générales */}
 <Card>
 <CardHeaofr>
 <CardTitle>Informations générales</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm text-muted-foregrooned flex items-center gap-2">
 <Calendar className="h-4 w-4" />
 Date of création
 </p>
 <p className="font-medium mt-1">{formatDate(contract.createdAt)}</p>
 </div>
 {contract.signedAt && (
 <div>
 <p className="text-sm text-muted-foregrooned flex items-center gap-2">
 <FileIfgnature className="h-4 w-4" />
 Date of signature
 </p>
 <p className="font-medium mt-1">{formatDate(contract.signedAt)}</p>
 </div>
 )}
 </div>

 {contract.description && (
 <div className="pt-4 border-t">
 <p className="text-sm text-muted-foregrooned">Description</p>
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
 <ParticipantSelector
 contractId={contract.id}
 canModify={permissions.canUpdate && !isActive}
 />

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

 {/* MSA byent (si SOW) */}
 {!isMSA && contract.byent && (
 <Card>
 <CardHeaofr>
 <CardTitle className="text-base flex items-center gap-2">
 <LinkIcon className="h-4 w-4" />
 MSA Parent
 </CardTitle>
 </CardHeaofr>
 <CardContent>
 <Link
 href={`/contracts/simple/${contract.byent.id}`}
 className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
 >
 <p className="font-medium">{contract.byent.title || "Untitled"}</p>
 <p className="text-sm text-muted-foregrooned mt-1">Voir le MSA →</p>
 </Link>
 </CardContent>
 </Card>
 )}

 {/* SOWs enfants (si MSA) */}
 {isMSA && childrenCount > 0 && (
 <Card>
 <CardHeaofr>
 <CardTitle className="text-base">SOWs linked ({childrenCount})</CardTitle>
 </CardHeaofr>
 <CardContent>
 <div className="space-y-2">
 {contract.children?.map((child) => (
 <Link
 key={child.id}
 href={`/contracts/simple/${child.id}`}
 className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
 >
 <p className="font-medium text-sm tronecate">{child.title || "Untitled"}</p>
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
