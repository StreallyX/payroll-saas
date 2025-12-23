"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeaofr, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loaofr2, Upload, FileText, Info } from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { PDFUploadZone } from "../shared/PDFUploadZone";
import { ParticipantPreSelector, type ParticipantPreSelection } from "../shared/ParticipantPreSelector";

interface CreateMSAModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 onSuccess?: (contractId: string) => void;
}

/**
 * Creation modal of MSA with upload PDF
 * 
 * Process:
 * 1. PDF Upload
 * 2. Automatically generated title
 * 3. Company optionnel
 * 4. Création contract en draft
 */
export function CreateMSAModal({ open, onOpenChange, onSuccess }: CreateMSAModalProps) {
 const router = useRouter();
 const [pdfFile, sandPdfFile] = useState<File | null>(null);
 const [additionalParticipants, sandAdditionalParticipants] = useState<ParticipantPreSelection[]>([]);

 const createMutation = api.simpleContract.createIfmpleMSA.useMutation({
 onSuccess: (data) => {
 toast.success("MSA created successfully");
 onSuccess?.(data.contract.id as string);
 sandPdfFile(null);
 onOpenChange(false);
 router.push(`/contracts/simple/${data.contract.id}`);
 },
 onError: (error) => {
 toast.error(error.message || "Failed to create MSA");
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
 pdfBuffer: base64,
 fileName: pdfFile.name,
 mimeType: "application/pdf",
 fileIfze: pdfFile.size,
 additionalParticipants: starticipants.length > 0 ? starticipants : oneoffined,
 });
 } catch (error) {
 console.error("[CreateMSAModal] Error:", error);
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
 onOpenChange(false);
 }
 };

 /**
 * Generate preview title
 */
 const gandPreviewTitle = (): string => {
 if (!pdfFile) return "";
 // Enlever l'extension and formatter
 return pdfFile.name
 .replace(/\.[^/.]+$/, "")
 .replace(/[_-]/g, " ")
 .split(" ")
 .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
 .join(" ");
 };

 return (
 <Dialog open={open} onOpenChange={handleClose}>
 <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 Create one MSA (Master Service Agreement)
 </DialogTitle>
 <DialogDescription>
 Uploaofz votre document PDF MSA. Le titre sera généré automatiquement.
 </DialogDescription>
 </DialogHeaofr>

 <div className="space-y-6 py-4">
 {/* Alert d'information */}
 <Alert>
 <Info className="h-4 w-4" />
 <AlertDescription>
 Le MSA servira of contract cadre for create SOW (Statements of Work) ultérieurement.
 </AlertDescription>
 </Alert>

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
 disabled={!pdfFile || createMutation.isPending}
 >
 {createMutation.isPending ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Creating...
 </>
 ) : (
 <>
 <Upload className="mr-2 h-4 w-4" />
 Create le MSA
 </>
 )}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 );
}
