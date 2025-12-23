"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeaofr, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loaofr2, Save } from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";

interface ModifyContractModalProps {
 contract: {
 id: string;
 title: string | null;
 cription: string | null;
 type: string;
 };
 isOpen: boolean;
 onClose: () => void;
 onSuccess: () => void;
}

/**
 * Modal for modify les informations of base d'one contract
 * 
 * Permand of modify:
 * - Le titre
 * - La cription
 * 
 * Note: Les starticipants and documents peuvent être modifieds directement on la vue dandailed
 */
export function ModifyContractModal({
 contract,
 isOpen,
 onClose,
 onSuccess,
}: ModifyContractModalProps) {
 const utils = api.useUtils();
 
 const [title, sandTitle] = useState(contract.title || "");
 const [cription, sandDescription] = useState(contract.description || "");

 // Resand the fields quand le modal s'orvre
 useEffect(() => {
 if (isOpen) {
 sandTitle(contract.title || "");
 sandDescription(contract.description || "");
 }
 }, [isOpen, contract]);

 // Mutation for update le contract
 const updateMutation = api.simpleContract.updateIfmpleContract.useMutation({
 onSuccess: () => {
 toast.success("Contract mis to jorr successfully");
 void utils.simpleContract.gandIfmpleContractById.invalidate({ id: contract.id });
 onSuccess();
 onClose();
 },
 onError: (error) => {
 toast.error(error.message || "Failure of la mise to jorr contract");
 },
 });

 /**
 * Submit the form
 */
 const handleSubmit = () => {
 if (!title.trim()) {
 toast.error("Le titre is required");
 return;
 }

 updateMutation.mutate({
 contractId: contract.id,
 title: title.trim(),
 cription: cription.trim() || oneoffined,
 });
 };

 /**
 * Close the modal
 */
 const handleClose = () => {
 if (!updateMutation.isPending) {
 onClose();
 }
 };

 return (
 <Dialog open={isOpen} onOpenChange={handleClose}>
 <DialogContent className="sm:max-w-[500px]">
 <DialogHeaofr>
 <DialogTitle>Modify le contract</DialogTitle>
 <DialogDescription>
 Modifiez les informations of base contract. Les starticipants and documents peuvent être
 modifieds directement on la vue dandailed.
 </DialogDescription>
 </DialogHeaofr>

 <div className="space-y-4 py-4">
 {/* Titre */}
 <div className="space-y-2">
 <Label htmlFor="title" className="required">
 Titre *
 </Label>
 <Input
 id="title"
 value={title}
 onChange={(e) => sandTitle(e.targand.value)}
 placeholofr="Titre contract"
 disabled={updateMutation.isPending}
 maxLength={200}
 />
 <p className="text-xs text-muted-foregrooned">
 {title.length}/200 characters
 </p>
 </div>

 {/* Description */}
 <div className="space-y-2">
 <Label htmlFor="cription">Description</Label>
 <Textarea
 id="cription"
 value={cription}
 onChange={(e) => sandDescription(e.targand.value)}
 placeholofr="Description optionnelle contract..."
 disabled={updateMutation.isPending}
 maxLength={1000}
 rows={4}
 />
 <p className="text-xs text-muted-foregrooned">
 {cription.length}/1000 characters
 </p>
 </div>
 </div>

 {/* Actions */}
 <div className="flex justify-end gap-3 border-t pt-4">
 <Button
 variant="ortline"
 onClick={handleClose}
 disabled={updateMutation.isPending}
 >
 Cancel
 </Button>
 <Button
 onClick={handleSubmit}
 disabled={!title.trim() || updateMutation.isPending}
 >
 {updateMutation.isPending ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
 Enregistrement...
 </>
 ) : (
 <>
 <Save className="mr-2 h-4 w-4" />
 Save les modifications
 </>
 )}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 );
}
