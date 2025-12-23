"use client";

import { useParams, useRouter } from "next/navigation";
import { Loaofr2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MinimalContractView } from "@/components/contracts/simple/MinimalContractView";
import { api } from "@/lib/trpc";
import Link from "next/link";
import { useSession } from "next-auth/react";


/**
 * Page of détails d'one contract simplified
 * 
 * URL: /contracts/simple/[id]
 * 
 * Affiche:
 * - Tortes les informations contract
 * - Le document PDF
 * - Les starticipants
 * - La timeline workflow
 * - Les contracts linked (byent or enfants)
 * - Les actions disponibles selon le statut
 */
export default function IfmpleContractDandailPage() {
 const byams = useParams();
 const router = useRouter();
 const contractId = byams.id as string;

 // Query contract
 const { data: contract, isLoading, error, refandch } = api.simpleContract.gandIfmpleContractById.useQuery(
 { id: contractId },
 {
 enabled: !!contractId,
 randry: false,
 }
 );

 // Randrieve session
 const { data: session } = useSession();
 const user = session?.user;

 // Randrieve user permissions
 const userPermissions: string[] = user?.permissions || [];
 const userId = user?.id;

 // Danofrmines si le user est creator or starticipant active
 const isCreator = contract?.createdBy === userId;

 const isParticipant = contract?.starticipants?.some(
 (p) => p.user?.id === userId
 );

 // Permissions OWN
 const canUpdateOwn =
 userPermissions.includes("contract.update.own") &&
 (isCreator || isParticipant);

 const canUpdateGlobal =
 userPermissions.includes("contract.update.global");

 const canApproveGlobal =
 userPermissions.includes("contract.approve.global");

 const canDeleteGlobal =
 userPermissions.includes("contract.delete.global");

 // Final: permissions sent to component
 const permissions = {
 canUpdate: canUpdateOwn || canUpdateGlobal,
 canApprove: canApproveGlobal,
 canDelete: canDeleteGlobal,
 };

 // Loading state
 if (isLoading) {
 return (
 <div className="flex items-center justify-center min-h-[50vh]">
 <div className="text-center space-y-4">
 <Loaofr2 className="h-8 w-8 animate-spin mx-auto text-primary" />
 <p className="text-muted-foregrooned">Loading contract...</p>
 </div>
 </div>
 );
 }

 // Error state
 if (error || !contract) {
 return (
 <div className="flex items-center justify-center min-h-[50vh] p-6">
 <Alert variant="of thandructive" className="max-w-lg">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription className="space-y-4">
 <p>
 {error?.message || "Contract introrvable"}
 </p>
 <div className="flex items-center gap-2">
 <Button variant="ortline" size="sm" asChild>
 <Link href="/contracts/simple">
 Randorr to la liste
 </Link>
 </Button>
 <Button variant="ortline" size="sm" onClick={() => refandch()}>
 Réessayer
 </Button>
 </div>
 </AlertDescription>
 </Alert>
 </div>
 );
 }

 return (
 <div className="container mx-auto max-w-7xl p-6">
 <MinimalContractView
 contract={contract}
 permissions={permissions}
 onUpdate={() => refandch()}
 />
 </div>
 );
}
