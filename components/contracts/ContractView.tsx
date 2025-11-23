"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Users,
  Building2,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";

import { api } from "@/lib/trpc";
import { LoadingState } from "@/components/shared/loading-state";
import { DocumentListView } from "@/components/documents/DocumentListView";

interface ContractViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
}

export function ContractViewModal({
  open,
  onOpenChange,
  contractId,
}: ContractViewModalProps) {
  const enabled = open && !!contractId;

  const { data: contract, isLoading } = api.contract.getById.useQuery(
    { id: contractId || "" },
    { enabled }
  );

  const { data: documents = [] } = api.document.list.useQuery(
    {
      entityType: "contract",
      entityId: contractId ?? "",
    },
    { enabled }
  );

  const formatDate = (d: any) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "-";

  const ROLE_LABELS: Record<string, string> = {
    contractor: "Contractor",
    client_admin: "Client Admin",
    approver: "Approver",
    agency: "Agency",
    payroll_partner: "Payroll Partner",
    reviewer: "Reviewer",
    finance: "Finance",
    legal: "Legal",
  };

  const coloredStatus = (status: string) =>
    (
      {
        draft: "bg-gray-100 text-gray-800",
        active: "bg-green-100 text-green-800",
        completed: "bg-blue-100 text-blue-800",
        cancelled: "bg-red-100 text-red-800",
        paused: "bg-yellow-100 text-yellow-800",
        terminated: "bg-red-200 text-red-900",
      } as any
    )[status] || "bg-gray-100 text-gray-800";

  if (!contractId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {contract?.title || "Contract"}
          </DialogTitle>

          {contract?.contractReference && (
            <p className="text-sm text-muted-foreground">
              Reference: {contract.contractReference}
            </p>
          )}
        </DialogHeader>

        {isLoading ? (
          <LoadingState message="Chargement du contrat..." />
        ) : !contract ? (
          <p className="text-center py-6 text-muted-foreground">
            Contrat introuvable
          </p>
        ) : (
          <div className="space-y-6">
            {/* STATUS */}
            <Card>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <Badge className={coloredStatus(contract.status)}>
                    {contract.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Workflow</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    {contract.workflowStatus.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Début</p>
                  <p className="font-medium">
                    {formatDate(contract.startDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Fin</p>
                  <p className="font-medium">
                    {formatDate(contract.endDate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PARTICIPANTS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-blue-500" />
                  Participants
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {contract.participants.map((p: any) => (
                  <div key={p.id} className="border rounded-md p-3">
                    <p className="font-semibold">{p.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.user.email}
                    </p>

                    <div className="mt-2 flex gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {ROLE_LABELS[p.role] || p.role}
                      </Badge>

                      {p.isPrimary && (
                        <Badge className="bg-purple-100 text-purple-800">
                          Primary
                        </Badge>
                      )}

                      {p.requiresSignature && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Signature Required
                        </Badge>
                      )}

                      {p.signedAt && (
                        <Badge className="bg-green-100 text-green-800">
                          Signed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* COMPANY */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  Company
                </CardTitle>
              </CardHeader>

              <CardContent>
                {contract.company ? (
                  <div>
                    <p className="font-medium">{contract.company.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contract.company.contactEmail}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No company linked
                  </p>
                )}
              </CardContent>
            </Card>

            {/* FINANCIAL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Financial Details
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="font-semibold">
                    {contract.rate?.toString() ?? "-"}
                  </p>
                  <p className="text-xs">{contract.rateType}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="font-semibold">
                    {contract.currencyId || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <p className="font-semibold">
                    {contract.marginType === "percentage"
                      ? `${contract.margin?.toString()}%`
                      : contract.margin?.toString() ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Salary Type</p>
                  <p className="font-semibold">{contract.salaryType}</p>
                </div>
              </CardContent>
            </Card>

            {/* DESCRIPTION & NOTES */}
            {(contract.description || contract.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-gray-500" />
                    Description & Notes
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {contract.description && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground">
                        Description
                      </p>
                      <p>{contract.description}</p>
                    </div>
                  )}

                  {contract.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p>{contract.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TERMINATION */}
            {contract.terminationReason && (
              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 text-base">
                    <AlertCircle className="h-5 w-5" />
                    Termination
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm">{contract.terminationReason}</p>
                  {contract.terminatedAt && (
                    <p className="text-xs mt-1">
                      Terminated on: {formatDate(contract.terminatedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* DOCUMENTS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-gray-500" />
                  Attached Documents
                </CardTitle>
              </CardHeader>

              <CardContent>
                <DocumentListView
                  entityType="contract"
                  entityId={contractId!}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
