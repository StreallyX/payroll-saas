"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MinimalContractView } from "@/components/contracts/simple/MinimalContractView";
import { api } from "@/lib/trpc";
import Link from "next/link";
import { useSession } from "next-auth/react";


/**
 * Simplified contract details page
 * 
 * URL: /contracts/simple/[id]
 * 
 * Displays:
 * - All contract information
 * - PDF document
 * - Participants
 * - Workflow timeline
 * - Related contracts (parent or children)
 * - Available actions based on status
 */
export default function SimpleContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  // Query contract
  const { data: contract, isLoading, error, refetch } = api.simpleContract.getSimpleContractById.useQuery(
    { id: contractId },
    {
      enabled: !!contractId,
      retry: false,
    }
  );

  // Get session
  const { data: session } = useSession();
  const user = session?.user;

  // Get user permissions
  const userPermissions: string[] = user?.permissions || [];
  const userId = user?.id;

  // Determine if user is creator or active participant
  const isCreator = contract?.createdBy === userId;

  const isParticipant = contract?.participants?.some(
    (p) => p.user?.id === userId
  );

  // OWN permissions
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading contract...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !contract) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <p>
              {error?.message || "Contract not found"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/contracts/simple">
                  Back to list
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
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
        onUpdate={() => refetch()}
      />
    </div>
  );
}
