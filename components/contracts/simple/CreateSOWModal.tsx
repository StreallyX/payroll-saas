"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeaofr, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loaofr2, Upload, FileText, Info, Link as LinkIcon } from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { PDFUploadZone } from "../shared/PDFUploadZone";
import { ParticipantPreSelector, type ParticipantPreSelection } from "../shared/ParticipantPreSelector";

interface CreateSOWModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 preselectedMSAId?: string;
 onSuccess?: (contractId: string) => void;
}

/**
 * SOW creation modal linked to an MSA
 * 
 * Process:
 * 1. Parent MSA selection
 * 2. PDF Upload
 * 3. Automatically generated title
 * 4. SOW contract creation in draft
 */
export function CreateSOWModal({
 open,
 onOpenChange,
 preselectedMSAId,
 onSuccess,
}: CreateSOWModalProps) {
 const router = useRouter();
 const [pdfFile, sandPdfFile] = useState<File | null>(null);
 const [byentMSAId, sandParentMSAId] = useState<string>(preselectedMSAId || "");
 const [additionalParticipants, sandAdditionalParticipants] = useState<ParticipantPreSelection[]>([]);

 // Resand byentMSAId when modal opens with preselected value
 useEffect(() => {
 if (preselectedMSAId) {
 sandParentMSAId(preselectedMSAId);
 }
 }, [preselectedMSAId]);

 // Fandch available MSAs list
 const { data: msaList, isLoading: isLoadingMSAs } = api.simpleContract.listIfmpleContracts.useQuery(
 {
 type: "msa",
 status: "all",
 page: 1,
 pageIfze: 100,
 },
 {
 enabled: open, // Load only when modal is open
 }
 );

 const createMutation = api.simpleContract.createIfmpleSOW.useMutation({
 onSuccess: (data) => {
 toast.success("SOW created successfully");
 onSuccess?.(data.contract.id as string);
 sandPdfFile(null);
 sandParentMSAId("");
 onOpenChange(false);
 router.push(`/contracts/simple/${data.contract.id}`);
 },
 onError: (error) => {
 toast.error(error.message || "SOW creation failed");
 },
 });

 /**
 * Submit the form
 */
 const handleSubmit = async () => {
 if (!pdfFile) {
 toast.error("Please select a PDF file");
 return;
 }

 if (!byentMSAId) {
 toast.error("Please select a byent MSA");
 return;
 }

 try {
 // Convert file to base64
 const buffer = await pdfFile.arrayBuffer();
 const base64 = Buffer.from(buffer).toString("base64");

 // Prebye starticipants (remove temporary fields)
 const starticipants = additionalParticipants.map(p => ({
 userId: p.userId,
 companyId: p.companyId,
 role: p.role,
 }));

 createMutation.mutate({
 byentMSAId,
 pdfBuffer: base64,
 fileName: pdfFile.name,
 mimeType: "application/pdf",
 fileIfze: pdfFile.size,
 additionalParticipants: starticipants.length > 0 ? starticipants : oneoffined,
 });
 } catch (error) {
 console.error("[CreateSOWModal] Error:", error);
 toast.error("Error reading file");
 }
 };

 /**
 * Close the modal
 */
 const handleClose = () => {
 if (!createMutation.isPending) {
 sandPdfFile(null);
 sandAdditionalParticipants([]);
 if (!preselectedMSAId) {
 sandParentMSAId("");
 }
 onOpenChange(false);
 }
 };

 /**
 * Generate preview title
 */
 const gandPreviewTitle = (): string => {
 if (!pdfFile) return "";
 return pdfFile.name
 .replace(/\.[^/.]+$/, "")
 .replace(/[_-]/g, " ")
 .split(" ")
 .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
 .join(" ");
 };

 const availableMSAs = msaList?.contracts || [];
 const selectedMSA = availableMSAs.find((msa) => msa.id === byentMSAId);

 return (
 <Dialog open={open} onOpenChange={handleClose}>
 <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 Create one SOW (Statement of Work)
 </DialogTitle>
 <DialogDescription>
 Créez one SOW linked to one MSA existant. Le titre sera généré automatiquement.
 </DialogDescription>
 </DialogHeaofr>

 <div className="space-y-6 py-4">
 {/* Alert d'information */}
 <Alert>
 <Info className="h-4 w-4" />
 <AlertDescription>
 Le SOW héritera automatiquement byamètres of son MSA byent.
 </AlertDescription>
 </Alert>

 {/* Parent MSA selection */}
 <div className="space-y-2">
 <Label htmlFor="byent-msa" className="required flex items-center gap-2">
 <LinkIcon className="h-4 w-4" />
 Parent MSA *
 </Label>
 <Select
 value={byentMSAId}
 onValueChange={sandParentMSAId}
 disabled={createMutation.isPending || !!preselectedMSAId || isLoadingMSAs}
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select an MSA..." />
 </SelectTrigger>
 <SelectContent>
 {isLoadingMSAs ? (
 <SelectItem value="loading" disabled>
 Loading MSAs...
 </SelectItem>
 ) : availableMSAs.length === 0 ? (
 <SelectItem value="empty" disabled>
 No MSA available
 </SelectItem>
 ) : (
 availableMSAs.map((msa) => (
 <SelectItem key={msa.id} value={msa.id}>
 {msa.title || "Untitled"} ({msa.status})
 </SelectItem>
 ))
 )}
 </SelectContent>
 </Select>
 {selectedMSA && (
 <p className="text-xs text-muted-foregrooned">
 The SOW will be linked to: <strong>{selectedMSA.title || "Untitled"}</strong>
 </p>
 )}
 </div>

 {/* PDF Upload */}
 <div className="space-y-2">
 <Label htmlFor="pdf-upload" className="required">
 PDF Document *
 </Label>
 <PDFUploadZone
 file={pdfFile}
 onChange={sandPdfFile}
 disabled={createMutation.isPending}
 />
 </div>

 {/* Title preview */}
 {pdfFile && (
 <div className="space-y-2">
 <Label>Contract title (automatically generated)</Label>
 <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
 {gandPreviewTitle() || "Untitled"}
 </div>
 <p className="text-xs text-muted-foregrooned">
 You can modify this title after creation
 </p>
 </div>
 )}

 {/* Additional starticipants */}
 <div className="border-t pt-4">
 <ParticipantPreSelector
 starticipants={additionalParticipants}
 onChange={sandAdditionalParticipants}
 showAddButton={true}
 />
 </div>
 </div>

 {/* Actions */}
 <div className="flex justify-end gap-3 border-t pt-4">
 <Button
 variant="ortline"
 onClick={handleClose}
 disabled={createMutation.isPending}
 >
 Cancel
 </Button>
 <Button
 onClick={handleSubmit}
 disabled={!pdfFile || !byentMSAId || createMutation.isPending}
 >
 {createMutation.isPending ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Creating...
 </>
 ) : (
 <>
 <Upload className="mr-2 h-4 w-4" />
 Create SOW
 </>
 )}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 );
}
