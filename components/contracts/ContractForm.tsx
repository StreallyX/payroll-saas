"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/trpc";

import { DocumentUploadButton } from "@/components/documents/DocumentUploadButton";
import { DocumentList } from "@/components/documents/DocumentList";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type ParticipantForm = {
  id?: string;
  userId: string;
  role: string;
  requiresSignature: boolean;
  isPrimary: boolean;
  signedAt?: string;
  signatureUrl?: string;
  isActive: boolean;
};

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------
export function ContractForm({
  open,
  onOpenChange,
  initialContract,
  onSubmit,
  submitting,
  showDocuments,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialContract: any | null;
  onSubmit: (payload: any) => void;
  submitting: boolean;
  showDocuments: boolean;
}) {
  // ------------------------------------------------------------
  // FORM
  // ------------------------------------------------------------
  const [form, setForm] = useState({
    title: "",
    description: "",
    notes: "",
    status: "draft",
    workflowStatus: "draft",
    contractReference: "",
    contractCountryId: "",
    contractVatRate: "",
    currencyId: "",
    bankId: "",
    rate: "",
    rateType: "hourly",
    rateCycle: "monthly",
    margin: "",
    marginType: "percentage",
    marginPaidBy: "client",
    salaryType: "gross",
    invoiceDueDays: "",
    companyId: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
    signedAt: "",
    terminatedAt: "",
    terminationReason: "",
    signedContractPath: "",
  });

  const [participants, setParticipants] = useState<ParticipantForm[]>([]);

  // ------------------------------------------------------------
  // LOAD DATA
  // ------------------------------------------------------------
  const { data: users = [] } = api.user.getAll.useQuery();
  const { data: countries = [] } = api.country.getAll.useQuery();
  const { data: currencies = [] } = api.currency.getAll.useQuery();
  const { data: banks = [] } = api.bank.getAll.useQuery();
  const { data: companies = [] } = api.company?.getAll?.useQuery?.() ?? { data: [] };

  const documentsQuery = api.document.list.useQuery(
    {
      entityType: "contract",
      entityId: initialContract?.id || "",
    },
    { enabled: !!initialContract && showDocuments }
  );

  // ------------------------------------------------------------
  // APPLY CONTRACT WHEN EDITING
  // ------------------------------------------------------------
  useEffect(() => {
    if (!initialContract) return;

    const fixWorkflow = (v: string | null | undefined) =>
      !v || v === "pending_signatures"
        ? "pending_agency_sign"
        : v;

    setForm({
      title: initialContract.title || "",
      description: initialContract.description || "",
      notes: initialContract.notes || "",
      status: initialContract.status || "draft",
      workflowStatus: fixWorkflow(initialContract.workflowStatus),
      contractReference: initialContract.contractReference || "",
      contractCountryId: initialContract.contractCountryId || "",
      contractVatRate: initialContract.contractVatRate?.toString() || "",
      currencyId: initialContract.currencyId || "",
      bankId: initialContract.bankId || "",
      rate: initialContract.rate?.toString() || "",
      rateType: initialContract.rateType || "hourly",
      rateCycle: initialContract.rateCycle || "monthly",
      margin: initialContract.margin?.toString() || "",
      marginType: initialContract.marginType || "percentage",
      marginPaidBy: initialContract.marginPaidBy || "client",
      salaryType: initialContract.salaryType || "gross",
      invoiceDueDays: initialContract.invoiceDueDays?.toString() || "",
      companyId: initialContract.companyId || "",
      assignedTo: initialContract.assignedTo || "",
      startDate: initialContract.startDate
        ? new Date(initialContract.startDate).toISOString().split("T")[0]
        : "",
      endDate: initialContract.endDate
        ? new Date(initialContract.endDate).toISOString().split("T")[0]
        : "",
      signedAt: initialContract.signedAt
        ? new Date(initialContract.signedAt).toISOString().split("T")[0]
        : "",
      terminatedAt: initialContract.terminatedAt
        ? new Date(initialContract.terminatedAt).toISOString().split("T")[0]
        : "",
      terminationReason: initialContract.terminationReason || "",
      signedContractPath: initialContract.signedContractPath || "",
    });

    setParticipants(
      initialContract.participants?.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        requiresSignature: p.requiresSignature,
        isPrimary: p.isPrimary,
        isActive: p.isActive,
        signedAt: p.signedAt
          ? new Date(p.signedAt).toISOString().split("T")[0]
          : "",
        signatureUrl: p.signatureUrl || "",
      })) || []
    );
  }, [initialContract]);

  // ------------------------------------------------------------
  // PAYLOAD
  // ------------------------------------------------------------
  const buildPayload = () => ({
    ...form,
    contractVatRate: form.contractVatRate
      ? parseFloat(form.contractVatRate)
      : undefined,
    rate: form.rate ? parseFloat(form.rate) : undefined,
    margin: form.margin ? parseFloat(form.margin) : undefined,
    invoiceDueDays: form.invoiceDueDays
      ? parseInt(form.invoiceDueDays)
      : undefined,
    startDate: form.startDate ? new Date(form.startDate) : undefined,
    endDate: form.endDate ? new Date(form.endDate) : undefined,
    signedAt: form.signedAt ? new Date(form.signedAt) : undefined,
    terminatedAt: form.terminatedAt ? new Date(form.terminatedAt) : undefined,
    participants: participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      role: p.role,
      requiresSignature: p.requiresSignature,
      isPrimary: p.isPrimary,
      isActive: p.isActive,
      signatureUrl: p.signatureUrl,
      signedAt: p.signedAt ? new Date(p.signedAt) : undefined,
    })),
  });

  const colCount = showDocuments ? "grid-cols-5" : "grid-cols-4";

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialContract ? "Edit Contract" : "Create Contract"}
          </DialogTitle>
          <DialogDescription>
            DEEL-style contract management
          </DialogDescription>
        </DialogHeader>

        {/* ---------------------------------------------------------------- */}
        {/* TABS */}
        {/* ---------------------------------------------------------------- */}
        <Tabs defaultValue="general">
          <TabsList className={`grid ${colCount}`}>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="dates">Dates</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            {showDocuments && (
              <TabsTrigger value="documents">Documents</TabsTrigger>
            )}
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          {/* GENERAL */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="general" className="pt-6 space-y-4">

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Workflow Status</Label>
                <Select
                  value={form.workflowStatus}
                  onValueChange={(v) =>
                    setForm({ ...form, workflowStatus: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_agency_sign">Pending Agency Signature</SelectItem>
                    <SelectItem value="pending_contractor_sign">Pending Contractor Signature</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reference</Label>
                <Input
                  value={form.contractReference}
                  onChange={(e) =>
                    setForm({ ...form, contractReference: e.target.value })
                  }
                />
              </div>
            </div>

            {/* COUNTRY / COMPANY / ASSIGNED */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Country</Label>
                <Select
                  value={form.contractCountryId}
                  onValueChange={(v) =>
                    setForm({ ...form, contractCountryId: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assigned To</Label>
                <Select
                  value={form.assignedTo}
                  onValueChange={(v) =>
                    setForm({ ...form, assignedTo: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Company</Label>
                <Select
                  value={form.companyId}
                  onValueChange={(v) =>
                    setForm({ ...form, companyId: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(companies as any[]).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* FINANCIAL */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="financial" className="pt-6 space-y-4">

            <div className="grid grid-cols-3 gap-4">

              <div>
                <Label>Rate</Label>
                <Input
                  type="number"
                  value={form.rate}
                  onChange={(e) =>
                    setForm({ ...form, rate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Rate Type</Label>
                <Select
                  value={form.rateType}
                  onValueChange={(v) =>
                    setForm({ ...form, rateType: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rate Cycle</Label>
                <Select
                  value={form.rateCycle}
                  onValueChange={(v) =>
                    setForm({ ...form, rateCycle: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="grid grid-cols-3 gap-4">

              <div>
                <Label>Margin</Label>
                <Input
                  type="number"
                  value={form.margin}
                  onChange={(e) =>
                    setForm({ ...form, margin: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Margin Type</Label>
                <Select
                  value={form.marginType}
                  onValueChange={(v) =>
                    setForm({ ...form, marginType: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Margin Paid By</Label>
                <Select
                  value={form.marginPaidBy}
                  onValueChange={(v) =>
                    setForm({ ...form, marginPaidBy: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currencyId}
                  onValueChange={(v) =>
                    setForm({ ...form, currencyId: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bank</Label>
                <Select
                  value={form.bankId}
                  onValueChange={(v) =>
                    setForm({ ...form, bankId: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {banks.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>VAT %</Label>
                <Input
                  type="number"
                  value={form.contractVatRate}
                  onChange={(e) =>
                    setForm({ ...form, contractVatRate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">

              <div>
                <Label>Salary Type</Label>
                <Select
                  value={form.salaryType}
                  onValueChange={(v) =>
                    setForm({ ...form, salaryType: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gross">Gross</SelectItem>
                    <SelectItem value="net">Net</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Invoice Due Days</Label>
                <Input
                  type="number"
                  value={form.invoiceDueDays}
                  onChange={(e) =>
                    setForm({ ...form, invoiceDueDays: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Signed Contract Path</Label>
                <Input
                  value={form.signedContractPath}
                  onChange={(e) =>
                    setForm({ ...form, signedContractPath: e.target.value })
                  }
                />
              </div>

            </div>

          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* DATES */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="dates" className="pt-6 space-y-4">

            <div className="grid grid-cols-3 gap-4">

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Signed At</Label>
                <Input
                  type="date"
                  value={form.signedAt}
                  onChange={(e) =>
                    setForm({ ...form, signedAt: e.target.value })
                  }
                />
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Terminated At</Label>
                <Input
                  type="date"
                  value={form.terminatedAt}
                  onChange={(e) =>
                    setForm({ ...form, terminatedAt: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Termination Reason</Label>
                <Textarea
                  rows={2}
                  value={form.terminationReason}
                  onChange={(e) =>
                    setForm({ ...form, terminationReason: e.target.value })
                  }
                />
              </div>
            </div>

          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* PARTICIPANTS */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="participants" className="pt-6 space-y-4">

            <Button
              variant="outline"
              onClick={() =>
                setParticipants([
                  ...participants,
                  {
                    userId: "",
                    role: "",
                    requiresSignature: false,
                    isPrimary: false,
                    isActive: true,
                  },
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add Participant
            </Button>

            {participants.map((p, i) => (
              <div key={i} className="border p-4 rounded-lg space-y-4">

                <div className="flex justify-between items-center">
                  <span className="font-medium">Participant {i + 1}</span>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setParticipants(participants.filter((_, x) => x !== i))
                    }
                  >
                    <Trash2 className="text-red-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">

                  <div>
                    <Label>User</Label>
                    <Select
                      value={p.userId}
                      onValueChange={(v) => {
                        const next = [...participants];
                        next[i].userId = v;
                        setParticipants(next);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {users.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Role</Label>
                    <Select
                      value={p.role}
                      onValueChange={(v) => {
                        const next = [...participants];
                        next[i].role = v;
                        setParticipants(next);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                        <SelectItem value="client_admin">Client Admin</SelectItem>
                        <SelectItem value="payroll_partner">Payroll Partner</SelectItem>
                        <SelectItem value="approver">Approver</SelectItem>
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Active</Label>
                    <Select
                      value={p.isActive ? "yes" : "no"}
                      onValueChange={(v) => {
                        const next = [...participants];
                        next[i].isActive = v === "yes";
                        setParticipants(next);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>

                <div className="grid grid-cols-3 gap-4">

                  <div>
                    <Label>Primary Participant</Label>
                    <Select
                      value={p.isPrimary ? "yes" : "no"}
                      onValueChange={(v) => {
                        const next = [...participants];
                        next[i].isPrimary = v === "yes";
                        setParticipants(next);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Requires Signature</Label>
                    <Select
                      value={p.requiresSignature ? "yes" : "no"}
                      onValueChange={(v) => {
                        const next = [...participants];
                        next[i].requiresSignature = v === "yes";
                        setParticipants(next);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Signed At</Label>
                    <Input
                      type="date"
                      value={p.signedAt || ""}
                      onChange={(e) => {
                        const next = [...participants];
                        next[i].signedAt = e.target.value;
                        setParticipants(next);
                      }}
                    />
                  </div>

                </div>

                <div className="space-y-2">
                  <Label>Signature URL</Label>
                  <Input
                    value={p.signatureUrl || ""}
                    onChange={(e) => {
                      const next = [...participants];
                      next[i].signatureUrl = e.target.value;
                      setParticipants(next);
                    }}
                    placeholder="https://..."
                  />
                </div>

              </div>
            ))}

          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* DOCUMENTS */}
          {/* ---------------------------------------------------------------- */}
          {showDocuments && (
            <TabsContent value="documents" className="pt-6 space-y-4">

              <div className="flex items-center justify-between">
                <div className="font-semibold">Attached Documents</div>
              </div>

              <DocumentList
                entityType="contract"
                entityId={initialContract?.id ?? ""}
              />

            </TabsContent>
          )}

        </Tabs>

        {/* ---------------------------------------------------------------- */}
        {/* FOOTER */}
        {/* ---------------------------------------------------------------- */}
        <DialogFooter className="pt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button disabled={submitting} onClick={() => onSubmit(buildPayload())}>
            {submitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            {initialContract ? "Update Contract" : "Create Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
