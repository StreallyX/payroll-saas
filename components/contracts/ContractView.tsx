"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  DollarSign,
  FileText,
  AlertCircle,
  Link2,
  Briefcase,
  Landmark,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/trpc";
import { LoadingState } from "@/components/shared/loading-state";
import { DocumentListView } from "@/components/documents/DocumentListView";

interface ContractViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
}

// -----------------------------
// Helpers
// -----------------------------
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

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  paused: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-200 text-red-900",
};

const WF_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_agency_sign: "bg-yellow-100 text-yellow-800",
  pending_contractor_sign: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  terminated: "bg-red-200 text-red-900",
};

const fmtDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const safe = (v: any, fallback = "—") => (v ?? v === 0 ? String(v) : fallback);
const joinList = (arr?: string[] | null) => (arr && arr.length ? arr.join(", ") : "—");
const toPctOrAmount = (type?: string | null, value?: any) =>
  type === "percentage" ? `${value ?? "—"}%` : safe(value);

// -----------------------------
// Small UI atoms
// -----------------------------
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-1 rounded-full text-xs bg-muted">{children}</span>;
}

export function ContractViewModal({ open, onOpenChange, contractId }: ContractViewModalProps) {
  const enabled = open && !!contractId;
  const { data: contract, isLoading } = api.contract.getById.useQuery(
    { id: contractId || "" },
    { enabled }
  );

  if (!contractId) return null;

  const type = contract?.type ?? "contract";
  const isMSA = type === "msa";
  const isSOW = type === "sow";
  const statusClass = contract ? STATUS_STYLE[contract.status] ?? STATUS_STYLE["draft"] : "";
  const wfClass = contract ? WF_STYLE[contract.workflowStatus] ?? WF_STYLE["draft"] : "";

  const currencyCode = contract?.currency?.code ?? contract?.currencyId ?? "—";

  // Participants regroupés par rôle (ordre prioritaire)
  const roleOrder = [
    "contractor",
    "client_admin",
    "approver",
    "agency",
    "payroll_partner",
    "finance",
    "legal",
    "reviewer",
  ];

  const participantsByRole: Record<string, any[]> = {};
  (contract?.participants ?? []).forEach((p: any) => {
    const key = p.role || "other";
    participantsByRole[key] = participantsByRole[key] || [];
    participantsByRole[key].push(p);
  });

  // Résumé parent (MSA) pour SOW
  const parentMSA = isSOW ? contract?.parent : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
            <Briefcase className="h-6 w-6 text-primary" />
            {contract?.title || (isMSA ? "Master Service Agreement" : isSOW ? "Statement of Work" : "Contract")}
            {isMSA && <Badge variant="secondary" className="ml-2">MSA</Badge>}
            {isSOW && <Badge variant="secondary" className="ml-2">SOW</Badge>}
          </DialogTitle>
          {contract?.contractReference && (
            <p className="text-sm text-muted-foreground">Référence : {contract.contractReference}</p>
          )}
        </DialogHeader>

        {isLoading ? (
          <LoadingState message="Chargement du contrat..." />
        ) : !contract ? (
          <p className="text-center py-6 text-muted-foreground">Contrat introuvable</p>
        ) : (
          <div className="space-y-6">
            {/* HEADER STATUS ROW */}
            <Card>
              <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-6">
                <Field
                  label="Statut"
                  value={<Badge className={statusClass}>{contract.status}</Badge>}
                />
                <Field
                  label="Workflow"
                  value={<Badge className={wfClass}>{contract.workflowStatus?.replace(/_/g, " ")}</Badge>}
                />
                <Field label="Type" value={<Pill>{(contract.type ?? "contract").toUpperCase()}</Pill>} />
                <Field label="Début" value={fmtDate(contract.startDate)} />
                <Field label="Fin" value={fmtDate(contract.endDate)} />
              </CardContent>

              {/* Parent MSA résumé quand on est sur un SOW */}
              {isSOW && parentMSA && (
                <CardContent className="pt-0">
                  <div className="mt-2 flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
                    <Link2 className="h-4 w-4 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="text-sm">
                        <span className="font-medium">Parent MSA :</span> {parentMSA.title ?? parentMSA.id}
                      </span>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Type : {parentMSA.type?.toUpperCase()}</span>
                        <span className="inline-block h-1 w-1 rounded-full bg-border" />
                        <span>ID : {parentMSA.id}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* SPECIFIC MSA PANELS */}
            {isMSA && (
              <>
                {/* MSA — Financial & Portal Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial & Portal Settings (MSA)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Field label="Fee Payer" value={safe(contract.feePayer)} />
                    <Field label="Payroll Modes" value={joinList(contract.payrollModes as string[])} />
                    <Field label="Extra Fees" value={joinList(contract.extraFees as string[])} />
                    <Field label="Require Deposit" value={contract.requireDeposit ? "Yes" : "No"} />
                    <Field label="Proof of Payment" value={contract.proofOfPayment ? "Required" : "Not required"} />
                    <Field label="Self Billing" value={contract.selfBilling ? "Enabled" : "Disabled"} />
                    <Field label="Timesheet Policy" value={safe(contract.timesheetPolicy)} />
                    <Field
                      label="Portal: View Workers"
                      value={<Badge variant={contract.portalCanViewWorkers ? "default" : "secondary"}>
                        {contract.portalCanViewWorkers ? "Allowed" : "Not allowed"}
                      </Badge>}
                    />
                    <Field
                      label="Portal: Upload Self Bill"
                      value={<Badge variant={contract.portalCanUploadSelfBill ? "default" : "secondary"}>
                        {contract.portalCanUploadSelfBill ? "Allowed" : "Not allowed"}
                      </Badge>}
                    />
                    <Field
                      label="Portal: Upload Payment Proof"
                      value={<Badge variant={contract.portalCanUploadPaymentProof ? "default" : "secondary"}>
                        {contract.portalCanUploadPaymentProof ? "Allowed" : "Not allowed"}
                      </Badge>}
                    />
                  </CardContent>
                </Card>

                {/* MSA — Children SOWs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Workflow className="h-5 w-5 text-purple-600" />
                      SOWs liés à ce MSA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contract.children && contract.children.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {contract.children.map((c: any) => (
                          <div key={c.id} className="rounded-md border p-3">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{c.title ?? c.id}</div>
                              <Badge className={STATUS_STYLE[c.status] ?? STATUS_STYLE["draft"]}>
                                {c.status}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                              <span>{(c.type ?? "sow").toUpperCase()}</span>
                              <span className="inline-block h-1 w-1 rounded-full bg-border" />
                              <span>ID: {c.id.slice(0, 8)}…</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun SOW lié.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* SPECIFIC SOW PANELS (or generic contract panels) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  Détails généraux
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Entreprise (Client)" value={contract.company?.name ?? "—"} />
                <Field label="Pays" value={contract.contractCountry?.name ?? "—"} />
                <Field label="Devise" value={currencyCode} />
                <Field label="Banque" value={contract.bank?.name ?? "—"} />
                <Field label="Invoice Due (jours)" value={safe(contract.invoiceDueDays)} />
                <Field label="Référence" value={contract.contractReference ?? "—"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Données financières
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Field label="Rate" value={safe(contract.rate?.toString())} />
                <Field label="Rate Type" value={safe(contract.rateType)} />
                <Field label="Margin" value={toPctOrAmount(contract.marginType, contract.margin?.toString())} />
                <Field label="Salary Type" value={safe(contract.salaryType)} />
                {isSOW && (
                  <>
                    <Field label="Payroll Modes" value={joinList(contract.payrollModes as string[])} />
                    <Field label="Invoice Due (jours)" value={safe(contract.invoiceDueDays)} />
                    <Field label="Extra Fees" value={joinList(contract.extraFees as string[])} />
                    <Field label="VAT Rate" value={safe(contract.contractVatRate?.toString())} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* PARTICIPANTS GROUPED */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-blue-500" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roleOrder
                  .filter((r) => (participantsByRole[r] || []).length > 0)
                  .map((role) => (
                    <div key={role} className="rounded-md border">
                      <div className="px-3 py-2 flex items-center gap-2 border-b bg-muted/40">
                        <Badge variant="secondary">{ROLE_LABELS[role] || role}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {(participantsByRole[role] || []).length} participant(s)
                        </span>
                      </div>
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(participantsByRole[role] || []).map((p: any) => (
                          <div key={p.id} className="rounded border p-3">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold">
                                {/* 🔥 Gérer les différents types de participants */}
                                {p.user && p.company
                                  ? `${p.user.name} (${p.company.name})`
                                  : p.user
                                  ? p.user.name
                                  : p.company
                                  ? p.company.name
                                  : "Participant inconnu"}
                              </div>
                              <div className="flex gap-2">
                                {p.isPrimary && <Badge className="bg-purple-100 text-purple-800">Primary</Badge>}
                                {p.requiresSignature && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Signature requise</Badge>
                                )}
                                {p.signedAt && (
                                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Signé
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {p.user?.email ?? (p.company ? "Entreprise" : "—")}
                            </div>
                            <div className="text-xs mt-2 flex items-center gap-2">
                              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Role Key :</span>
                              <code>{p.role}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                {/* Participants sans rôle connu */}
                {(participantsByRole["other"] || []).length > 0 && (
                  <div className="rounded-md border">
                    <div className="px-3 py-2 flex items-center gap-2 border-b bg-muted/40">
                      <Badge variant="secondary">Other</Badge>
                    </div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(participantsByRole["other"] || []).map((p: any) => (
                        <div key={p.id} className="rounded border p-3">
                          <div className="font-semibold">
                            {/* 🔥 Gérer les différents types de participants */}
                            {p.user && p.company
                              ? `${p.user.name} (${p.company.name})`
                              : p.user
                              ? p.user.name
                              : p.company
                              ? p.company.name
                              : "Participant inconnu"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.user?.email ?? (p.company ? "Entreprise" : "—")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DESCRIPTION & NOTES */}
            {(contract.description || contract.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Description & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="leading-relaxed">{contract.description}</p>
                    </div>
                  )}
                  {contract.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="leading-relaxed">{contract.notes}</p>
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
                    <p className="text-xs mt-1">Terminated on: {fmtDate(contract.terminatedAt)}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* STATUTS HISTORIQUES (optionnel si inclus) */}
            {contract.statusHistory && contract.statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Workflow className="h-5 w-5 text-indigo-600" />
                    Historique des statuts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contract.statusHistory.map((h: any, idx: number) => (
                    <div key={h.id ?? idx} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">{h.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{fmtDate(h.changedAt)}</span>
                      {h.changedBy && (
                        <>
                          <span className="inline-block h-1 w-1 rounded-full bg-border" />
                          <span className="text-muted-foreground">by {h.changedBy}</span>
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* DOCUMENTS (toujours en bas, avec ton composant) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Documents attachés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentListView entityType="contract" entityId={contractId!} />
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
