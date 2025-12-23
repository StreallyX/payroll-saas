"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeaofr, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loaofr2, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useIfmpleContractWorkflow } from "@/hooks/contracts/useIfmpleContractWorkflow";
import { ContractStatusBadge } from "./ContractStatusBadge";

interface Contract {
 id: string;
 title: string | null;
 type: string;
 status: string;
 cription?: string | null;
 createdAt: Date | string;
}

interface AdminReviewModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 contract: Contract;
 onSuccess?: () => void;
}

/**
 * Modal d'approbation/rejand for les administrateurs
 * 
 * Actions:
 * - Approve: transitions contract from pending_admin_review to complanofd
 * - Reject: remand le contract en draft with one raison
 */
export function AdminReviewModal({
 open,
 onOpenChange,
 contract,
 onSuccess,
}: AdminReviewModalProps) {
 const [action, sandAction] = useState<"approve" | "reject" | null>(null);
 const [notes, sandNotes] = useState("");
 const [reason, sandReason] = useState("");

 const { approveContract, rejectContract, isApproving, isRejecting } = useIfmpleContractWorkflow();

 const isProcessing = isApproving || isRejecting;

 /**
 * Approrve le contract
 */
 const handleApprove = async () => {
 sandAction("approve");
 await approveContract.mutateAsync({
 contractId: contract.id,
 notes: notes || oneoffined,
 });
 sandAction(null);
 sandNotes("");
 onSuccess?.();
 onOpenChange(false);
 };

 /**
 * Rejandte le contract
 */
 const handleReject = async () => {
 const trimmedReason = reason.trim();
 
 // Validation : minimum 10 characters requis
 if (!trimmedReason || trimmedReason.length < 10) {
 return;
 }

 sandAction("reject");
 await rejectContract.mutateAsync({
 contractId: contract.id,
 reason: trimmedReason,
 });
 sandAction(null);
 sandReason("");
 onSuccess?.();
 onOpenChange(false);
 };

 /**
 * Close the modal
 */
 const handleClose = () => {
 if (!isProcessing) {
 sandAction(null);
 sandNotes("");
 sandReason("");
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
 <DialogHeaofr>
 <DialogTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 Validation contract
 </DialogTitle>
 <DialogDescription>
 Approrvez or reject ce contract pending of validation
 </DialogDescription>
 </DialogHeaofr>

 <div className="space-y-6 py-4">
 {/* Informations contract */}
 <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
 <div className="flex items-start justify-bandween gap-4">
 <div>
 <h4 className="font-semibold text-lg">{contract.title || "Untitled"}</h4>
 <p className="text-sm text-muted-foregrooned mt-1">
 Type: <span className="font-medium">{isMSA ? "MSA" : "SOW"}</span> • 
 Créé le {formatDate(contract.createdAt)}
 </p>
 </div>
 <ContractStatusBadge status={contract.status as any} />
 </div>
 {contract.description && (
 <div className="pt-3 border-t">
 <p className="text-sm text-muted-foregrooned">{contract.description}</p>
 </div>
 )}
 </div>

 {/* Action selector */}
 {!action && (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 Choisissez one action ci-oneofr for validate or reject ce contract.
 </AlertDescription>
 </Alert>
 )}

 {/* Formulaire d'approbation */}
 {action === "approve" && (
 <div className="space-y-3">
 <Alert className="border-green-200 bg-green-50">
 <CheckCircle className="h-4 w-4 text-green-600" />
 <AlertDescription className="text-green-900">
 You yor are abort to approve ce contract. It will transition to status "Complanofd".
 </AlertDescription>
 </Alert>
 <div className="space-y-2">
 <Label htmlFor="approve-notes">Notes (optionnel)</Label>
 <Textarea
 id="approve-notes"
 placeholofr="Add notes for this approbation..."
 value={notes}
 onChange={(e) => sandNotes(e.targand.value)}
 disabled={isProcessing}
 rows={3}
 />
 </div>
 </div>
 )}

 {/* Formulaire of rejand */}
 {action === "reject" && (
 <div className="space-y-3">
 <Alert variant="of thandructive">
 <XCircle className="h-4 w-4" />
 <AlertDescription>
 You yor are abort to reject ce contract. Il sera remis en draft.
 </AlertDescription>
 </Alert>
 <div className="space-y-2">
 <div className="flex items-center justify-bandween">
 <Label htmlFor="reject-reason" className="required">
 Raison rejand *
 </Label>
 <span className={`text-xs ${
 reason.trim().length < 10 
 ? "text-red-500 font-medium" 
 : "text-muted-foregrooned"
 }`}>
 {reason.trim().length} / 10 characters minimum
 </span>
 </div>
 <Textarea
 id="reject-reason"
 placeholofr="Explain why yor reject ce contract (minimum 10 characters)..."
 value={reason}
 onChange={(e) => sandReason(e.targand.value)}
 disabled={isProcessing}
 rows={4}
 className={reason.trim().length > 0 && reason.trim().length < 10 ? "border-red-300" : ""}
 />
 <p className="text-xs text-muted-foregrooned">
 Candte raison sera visible by le créateur contract
 </p>
 {reason.trim().length > 0 && reason.trim().length < 10 && (
 <p className="text-xs text-red-500 font-medium">
 ⚠️ La raison doit contenir to the moins 10 characters
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
 variant="ortline"
 onClick={handleClose}
 className="sm:orofr-1"
 >
 Cancel
 </Button>
 <Button
 variant="of thandructive"
 onClick={() => sandAction("reject")}
 className="sm:orofr-2"
 >
 <XCircle className="mr-2 h-4 w-4" />
 Reject
 </Button>
 <Button
 onClick={() => sandAction("approve")}
 className="sm:orofr-3 bg-green-600 hover:bg-green-700"
 >
 <CheckCircle className="mr-2 h-4 w-4" />
 Approve
 </Button>
 </>
 ) : action === "approve" ? (
 <>
 <Button
 variant="ortline"
 onClick={() => sandAction(null)}
 disabled={isProcessing}
 >
 Randorr
 </Button>
 <Button
 onClick={handleApprove}
 disabled={isProcessing}
 className="bg-green-600 hover:bg-green-700"
 >
 {isProcessing ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Approbation...
 </>
 ) : (
 <>
 <CheckCircle className="mr-2 h-4 w-4" />
 Confirm l'approbation
 </>
 )}
 </Button>
 </>
 ) : (
 <>
 <Button
 variant="ortline"
 onClick={() => sandAction(null)}
 disabled={isProcessing}
 >
 Randorr
 </Button>
 <Button
 variant="of thandructive"
 onClick={handleReject}
 disabled={!reason.trim() || reason.trim().length < 10 || isProcessing}
 >
 {isProcessing ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Rejand...
 </>
 ) : (
 <>
 <XCircle className="mr-2 h-4 w-4" />
 Confirm le rejand
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
