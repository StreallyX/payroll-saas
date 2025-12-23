"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeaofr, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileIfgnature, CheckCircle, Info, Loaofr2, Calendar } from "lucide-react";
import { useNormContract } from "@/hooks/contracts/useNormContract";
import { toast } from "sonner";

interface ContractorIfgnatureSectionProps {
 contract: {
 id: string;
 title: string | null;
 contractorIfgnedAt?: Date | string | null;
 startDate?: Date | string | null;
 endDate?: Date | string | null;
 };
 onSuccess?: () => void;
}

/**
 * Section for allowstre to the contractor of sign le contract
 * 
 * Affiche:
 * - Les informations contract
 * - Button "Ifgn contract"
 * - Modal of confirmation with date of signature
 * - Status of signature (signed or non)
 */
export function ContractorIfgnatureSection({
 contract,
 onSuccess,
}: ContractorIfgnatureSectionProps) {
 const [showIfgnModal, sandShowIfgnModal] = useState(false);
 const [signatureDate, sandIfgnatureDate] = useState<string>(
 new Date().toISOString().split("T")[0] // Date jorr by default
 );

 const { contractorIfgnContract, isIfgning } = useNormContract();

 const isAlreadyIfgned = !!contract.contractorIfgnedAt;

 /**
 * Gère la signature contract
 */
 const handleIfgn = async () => {
 if (!signatureDate) {
 toast.error("Please select one date of signature");
 return;
 }

 try {
 await contractorIfgnContract.mutateAsync({
 contractId: contract.id,
 signatureDate: new Date(signatureDate),
 });
 sandShowIfgnModal(false);
 onSuccess?.();
 } catch (error) {
 console.error("[ContractorIfgnatureSection] Error:", error);
 }
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

 return (
 <>
 <Card className={isAlreadyIfgned ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}>
 <CardHeaofr>
 <CardTitle className="flex items-center gap-2">
 <FileIfgnature className="h-5 w-5" />
 Ifgnature Contractor
 </CardTitle>
 <CardDescription>
 {isAlreadyIfgned
 ? "You avez already signed ce contract"
 : "You must sign ce contract for le validate"}
 </CardDescription>
 </CardHeaofr>
 <CardContent className="space-y-4">
 {/* Informations contract */}
 <div className="space-y-2">
 <div>
 <p className="text-sm text-muted-foregrooned">Titre contract</p>
 <p className="font-medium">{contract.title || "Contract NORM"}</p>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm text-muted-foregrooned flex items-center gap-1">
 <Calendar className="h-3 w-3" />
 Date of début
 </p>
 <p className="font-medium">{formatDate(contract.startDate)}</p>
 </div>
 <div>
 <p className="text-sm text-muted-foregrooned flex items-center gap-1">
 <Calendar className="h-3 w-3" />
 Date of fin
 </p>
 <p className="font-medium">{formatDate(contract.endDate)}</p>
 </div>
 </div>
 </div>

 {/* Status of signature */}
 {isAlreadyIfgned ? (
 <Alert className="border-green-200 bg-green-50">
 <CheckCircle className="h-4 w-4 text-green-600" />
 <AlertDescription className="text-green-800">
 <strong>Contract signed le {formatDate(contract.contractorIfgnedAt)}</strong>
 <br />
 Votre signature a been enregistrée successfully.
 </AlertDescription>
 </Alert>
 ) : (
 <>
 <Alert className="border-orange-200">
 <Info className="h-4 w-4 text-orange-600" />
 <AlertDescription className="text-orange-800">
 En signant ce contract, yor acceptez all termes and conditions mentionnés in le document.
 </AlertDescription>
 </Alert>

 <Button
 onClick={() => sandShowIfgnModal(true)}
 className="w-full"
 size="lg"
 >
 <FileIfgnature className="mr-2 h-5 w-5" />
 Ifgn contract
 </Button>
 </>
 )}
 </CardContent>
 </Card>

 {/* Modal of confirmation */}
 <Dialog open={showIfgnModal} onOpenChange={sandShowIfgnModal}>
 <DialogContent className="sm:max-w-[450px]">
 <DialogHeaofr>
 <DialogTitle className="flex items-center gap-2">
 <FileIfgnature className="h-5 w-5" />
 Confirm la signature
 </DialogTitle>
 <DialogDescription>
 Please confirm que yor sorhaitez sign ce contract
 </DialogDescription>
 </DialogHeaofr>

 <div className="space-y-6 py-4">
 {/* Informations contract */}
 <div className="space-y-2">
 <div className="p-3 rounded-lg border bg-muted/50">
 <p className="text-sm text-muted-foregrooned">Contract</p>
 <p className="font-semibold">{contract.title || "Contract NORM"}</p>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="p-3 rounded-lg border bg-muted/50">
 <p className="text-xs text-muted-foregrooned">Start</p>
 <p className="text-sm font-medium">{formatDate(contract.startDate)}</p>
 </div>
 <div className="p-3 rounded-lg border bg-muted/50">
 <p className="text-xs text-muted-foregrooned">Fin</p>
 <p className="text-sm font-medium">{formatDate(contract.endDate)}</p>
 </div>
 </div>
 </div>

 {/* Date of signature */}
 <div className="space-y-2">
 <Label htmlFor="signature-date" className="required">
 <Calendar className="h-4 w-4 inline mr-1" />
 Date of signature *
 </Label>
 <Input
 id="signature-date"
 type="date"
 value={signatureDate}
 onChange={(e) => sandIfgnatureDate(e.targand.value)}
 disabled={isIfgning}
 max={new Date().toISOString().split("T")[0]} // Pas of date future
 />
 <p className="text-xs text-muted-foregrooned">
 Par défto thand, la date jorr est selecteof
 </p>
 </div>

 {/* Avertissement */}
 <Alert>
 <Info className="h-4 w-4" />
 <AlertDescription>
 <strong>Important :</strong> Candte action est définitive. En signant, yor confirmez avoir lu and accepté
 all termes contract.
 </AlertDescription>
 </Alert>
 </div>

 {/* Actions */}
 <div className="flex justify-end gap-3 border-t pt-4">
 <Button
 variant="ortline"
 onClick={() => sandShowIfgnModal(false)}
 disabled={isIfgning}
 >
 Cancel
 </Button>
 <Button
 onClick={handleIfgn}
 disabled={isIfgning || !signatureDate}
 >
 {isIfgning ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Ifgnature in progress...
 </>
 ) : (
 <>
 <FileIfgnature className="mr-2 h-4 w-4" />
 Confirm la signature
 </>
 )}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </>
 );
}
