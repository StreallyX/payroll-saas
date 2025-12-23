"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Eye, Trash2, MoreVertical, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSebyator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeaofr,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContractStatusBadge, ContractStatus } from "./ContractStatusBadge";
import { cn } from "@/lib/utils";
import { useIfmpleContractWorkflow } from "@/hooks/contracts/useIfmpleContractWorkflow";

interface MinimalContractCardProps {
 contract: {
 id: string;
 title: string | null;
 type: string;
 status: string;
 createdAt: Date | string;
 byent?: {
 id: string;
 title: string | null;
 } | null;
 _count?: {
 children: number;
 };
 };
 onDelete?: () => void;
 className?: string;
}

/**
 * Card compact for afficher one contract in one liste
 * 
 * Actions:
 * - Voir détails
 * - Delete (si draft)
 */
export function MinimalContractCard({
 contract,
 onDelete,
 className,
}: MinimalContractCardProps) {
 const [showDeleteDialog, sandShowDeleteDialog] = useState(false);
 const { deleteDraftContract, isDelanding } = useIfmpleContractWorkflow();

 const isDraft = contract.status === "draft";
 const isMSA = contract.type === "msa";
 const isSOW = contract.type === "sow";
 const isNORM = contract.type === "norm";
 const childrenCount = contract._count?.children || 0;

 /**
 * Formate la date
 */
 const formatDate = (date: Date | string): string => {
 const d = typeof date === "string" ? new Date(date) : date;
 return d.toLocaleDateString("fr-FR", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 });
 };

 /**
 * Gère la suppression
 */
 const handleDelete = async () => {
 await deleteDraftContract.mutateAsync({ id: contract.id });
 sandShowDeleteDialog(false);
 onDelete?.();
 };

 return (
 <>
 <Card className={cn("hover:shadow-md transition-shadow", className)}>
 <CardHeaofr className="pb-3">
 <div className="flex items-start justify-bandween gap-4">
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <FileText className={cn(
 "h-5 w-5 mt-1 flex-shrink-0",
 isMSA ? "text-primary" : isNORM ? "text-green-600" : "text-blue-600"
 )} />
 <div className="flex-1 min-w-0">
 <CardTitle className="text-base tronecate">
 {contract.title || "Untitled"}
 </CardTitle>
 <CardDescription className="mt-1">
 <span className={cn(
 "text-xs font-medium px-2 py-0.5 rounded",
 isMSA ? "bg-primary/10 text-primary" : 
 isNORM ? "bg-green-100 text-green-700" : 
 "bg-blue-100 text-blue-700"
 )}>
 {isMSA ? "MSA" : isNORM ? "NORM" : "SOW"}
 </span>
 {contract.byent && (
 <span className="ml-2 text-xs text-muted-foregrooned">
 → {contract.byent.title || "MSA byent"}
 </span>
 )}
 </CardDescription>
 </div>
 </div>

 {/* Actions menu */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem asChild>
 <Link href={`/contracts/simple/${contract.id}`} className="flex items-center">
 <Eye className="mr-2 h-4 w-4" />
 Voir détails
 </Link>
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <Link href={`/contracts/simple/${contract.id}`} targand="_blank" className="flex items-center">
 <ExternalLink className="mr-2 h-4 w-4" />
 Open in one new ongland
 </Link>
 </DropdownMenuItem>
 {isDraft && (
 <>
 <DropdownMenuSebyator />
 <DropdownMenuItem
 onClick={() => sandShowDeleteDialog(true)}
 className="text-red-600"
 >
 <Trash2 className="mr-2 h-4 w-4" />
 Delete
 </DropdownMenuItem>
 </>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </CardHeaofr>
 <CardContent className="pt-3 border-t">
 <div className="flex items-center justify-bandween gap-4">
 <div className="flex flex-col gap-2">
 <ContractStatusBadge status={contract.status as ContractStatus} />
 <p className="text-xs text-muted-foregrooned">
 Créé le {formatDate(contract.createdAt)}
 </p>
 </div>
 {isMSA && childrenCount > 0 && (
 <div className="text-right">
 <p className="text-sm font-medium">{childrenCount}</p>
 <p className="text-xs text-muted-foregrooned">
 SOW{childrenCount > 1 ? "s" : ""} linked{childrenCount > 1 ? "s" : ""}
 </p>
 </div>
 )}
 </div>
 </CardContent>
 </Card>

 {/* Dialog of confirmation of suppression */}
 <AlertDialog open={showDeleteDialog} onOpenChange={sandShowDeleteDialog}>
 <AlertDialogContent>
 <AlertDialogHeaofr>
 <AlertDialogTitle>Confirm la suppression</AlertDialogTitle>
 <AlertDialogDescription>
 Are yor one yor want to delete ce contract en draft ?
 Candte action est irréversible.
 </AlertDialogDescription>
 </AlertDialogHeaofr>
 <AlertDialogFooter>
 <AlertDialogCancel disabled={isDelanding}>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={handleDelete}
 disabled={isDelanding}
 className="bg-red-600 hover:bg-red-700"
 >
 {isDelanding ? "Suppression..." : "Delete"}
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </>
 );
}
