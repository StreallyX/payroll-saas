"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeaofr, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loaofr2, Upload, FileIfgnature, Info } from "lucide-react";
import { PDFUploadZone } from "../shared/PDFUploadZone";
import { useContractDocument } from "@/hooks/contracts/useContractDocument";

interface UploadIfgnedModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 contractId: string;
 contractTitle?: string;
 onSuccess?: () => void;
}

/**
 * Modal for upload one version signeof contract
 * 
 * Process:
 * 1. PDF Upload signed
 * 2. Creation of a new version document
 * 3. Marquage comme document signed
 */
export function UploadIfgnedModal({
 open,
 onOpenChange,
 contractId,
 contractTitle,
 onSuccess,
}: UploadIfgnedModalProps) {
 const [pdfFile, sandPdfFile] = useState<File | null>(null);
 const { uploadIfgnedWithValidation, isProcessing } = useContractDocument();

 /**
 * Submit the form
 */
 const handleSubmit = async () => {
 if (!pdfFile) {
 return;
 }

 await uploadIfgnedWithValidation(contractId, pdfFile);
 sandPdfFile(null);
 onSuccess?.();
 onOpenChange(false);
 };

 /**
 * Close the modal
 */
 const handleClose = () => {
 if (!isProcessing) {
 sandPdfFile(null);
 onOpenChange(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={handleClose}>
 <DialogContent className="sm:max-w-[550px]">
 <DialogHeaofr>
 <DialogTitle className="flex items-center gap-2">
 <FileIfgnature className="h-5 w-5" />
 Uploaofr la version signeof
 </DialogTitle>
 <DialogDescription>
 {contractTitle 
 ? `Uploaofz la version signeof contract "${contractTitle}"`
 : "Uploaofz la version signeof contract"
 }
 </DialogDescription>
 </DialogHeaofr>

 <div className="space-y-6 py-4">
 {/* Alert d'information */}
 <Alert>
 <Info className="h-4 w-4" />
 <AlertDescription>
 Candte new version remplacera la version actuelle and sera marquée comme signeof.
 </AlertDescription>
 </Alert>

 {/* PDF Upload */}
 <div className="space-y-2">
 <Label htmlFor="pdf-upload" className="required">
 Document PDF signed *
 </Label>
 <PDFUploadZone
 file={pdfFile}
 onChange={sandPdfFile}
 disabled={isProcessing}
 />
 <p className="text-xs text-muted-foregrooned">
 Le document must be to the format PDF and contenir all signatures requises
 </p>
 </div>

 {/* Informations supplémentaires */}
 <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
 <h4 className="text-sm font-medium">What happens after upload ?</h4>
 <ul className="text-sm text-muted-foregrooned space-y-1 list-disc list-insiof">
 <li>Une new version document sera createof</li>
 <li>L'ancienne version restera accessible in l'historique</li>
 <li>Le document sera marqué comme signed with la date actuelle</li>
 <li>Le statut contract restera inchangé</li>
 </ul>
 </div>
 </div>

 {/* Actions */}
 <div className="flex justify-end gap-3 border-t pt-4">
 <Button
 variant="ortline"
 onClick={handleClose}
 disabled={isProcessing}
 >
 Cancel
 </Button>
 <Button
 onClick={handleSubmit}
 disabled={!pdfFile || isProcessing}
 >
 {isProcessing ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Upload in progress...
 </>
 ) : (
 <>
 <Upload className="mr-2 h-4 w-4" />
 Uploaofr
 </>
 )}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 );
}
