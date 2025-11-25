"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign,
  Building2,
  Users,
  Workflow,
  FileText,
} from "lucide-react";

import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared/loading-state";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { DocumentListView } from "@/components/documents/DocumentListView";

// ---------------------------
// TYPES
// ---------------------------
interface ContractParticipantForm {
  id?: string;
  userId: string;
  role: string;
  requiresSignature: boolean;
  isPrimary: boolean;
}

interface ContractForm {
  id: string;

  type: "contract" | "msa" | "sow";
  parentId?: string | null;

  status: "draft" | "active" | "completed" | "cancelled" | "paused";
  workflowStatus:
    | "draft"
    | "pending_agency_sign"
    | "pending_contractor_sign"
    | "active"
    | "paused"
    | "completed"
    | "cancelled"
    | "terminated";

  companyId?: string | null;
  contractCountryId?: string | null;
  currencyId?: string | null;
  bankId?: string | null;

  title?: string | null;
  contractReference?: string | null;

  startDate?: string | null;
  endDate?: string | null;

  invoiceDueDays?: number | null;

  rate?: number | null;
  rateType?: string | null;
  margin?: number | null;
  marginType?: string | null;
  marginPaidBy?: string | null;
  salaryType?: string | null;
  rateCycle?: string | null;
  contractVatRate?: number | null;

  feePayer?: string | null;
  payrollModes?: string[];
  extraFees?: string[];
  requireDeposit?: boolean;
  proofOfPayment?: boolean;
  selfBilling?: boolean;
  timesheetPolicy?: string | null;

  portalCanViewWorkers?: boolean;
  portalCanUploadSelfBill?: boolean;
  portalCanUploadPaymentProof?: boolean;

  participants: ContractParticipantForm[];

  description?: string | null;
  notes?: string | null;

  terminationReason?: string | null;
  terminatedAt?: Date | null;
}

interface ContractEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
}

const fmtDate = (d: any) =>
  d ? new Date(d).toISOString().substring(0, 10) : "";

// ---------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------
export function ContractEdit({ open, onOpenChange, contractId }: ContractEditProps) {
  const enabled = open && !!contractId;
  const utils = api.useUtils();

  const { data: contract, isLoading } = api.contract.getById.useQuery(
    { id: contractId || "" },
    { enabled }
  );

  const updateMutation = api.contract.update.useMutation({
    onSuccess: async () => {
      toast.success("Contract updated");
      await utils.contract.getById.invalidate();
      await utils.contract.getAll.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState<ContractForm | null>(null);

  // PRELOAD FORM
  useEffect(() => {
    if (contract) {
      setForm({
        ...(contract as any),
        startDate: fmtDate(contract.startDate),
        endDate: fmtDate(contract.endDate),
      });
    }
  }, [contract]);

  const setField = <K extends keyof ContractForm>(key: K, value: ContractForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  if (!contractId) return null;

  const isMSA = contract?.type === "msa";
  const isSOW = contract?.type === "sow";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto px-6 py-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            ✏️ Edit Contract
            {isMSA && <Badge>MSA</Badge>}
            {isSOW && <Badge>SOW</Badge>}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !form ? (
          <LoadingState message="Loading..." />
        ) : (
          <div className="space-y-10">

            {/* ---------------------------- */}
            {/* 1. META */}
            {/* ---------------------------- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-purple-600" />
                  Contract Meta
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status || ""}
                    onValueChange={(v) => setField("status", v as ContractForm["status"])}

                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Workflow */}
                <div>
                  <Label>Workflow Status</Label>
                  <Select
                    value={form.workflowStatus || ""}
                    onValueChange={(v) => setField("workflowStatus", v as ContractForm["workflowStatus"])}

                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_agency_sign">
                        Pending Agency Sign
                      </SelectItem>
                      <SelectItem value="pending_contractor_sign">
                        Pending Contractor Sign
                      </SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Parent ID */}
                {isSOW && (
                  <div>
                    <Label>Parent MSA</Label>
                    <Input
                      value={form.parentId || ""}
                      onChange={(e) => setField("parentId", e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ---------------------------- */}
            {/* 2. GENERAL */}
            {/* ---------------------------- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  General Details
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Company ID</Label>
                  <Input
                    value={form.companyId || ""}
                    onChange={(e) => setField("companyId", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Contract Country</Label>
                  <Input
                    value={form.contractCountryId || ""}
                    onChange={(e) => setField("contractCountryId", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Currency</Label>
                  <Input
                    value={form.currencyId || ""}
                    onChange={(e) => setField("currencyId", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Bank</Label>
                  <Input
                    value={form.bankId || ""}
                    onChange={(e) => setField("bankId", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title || ""}
                    onChange={(e) => setField("title", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Reference</Label>
                  <Input
                    value={form.contractReference || ""}
                    onChange={(e) => setField("contractReference", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Invoice Due Days</Label>
                  <Input
                    type="number"
                    value={form.invoiceDueDays ?? ""}
                    onChange={(e) => setField("invoiceDueDays", Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.startDate || ""}
                    onChange={(e) => setField("startDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate || ""}
                    onChange={(e) => setField("endDate", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ---------------------------- */}
            {/* 3. FINANCIAL */}
            {/* ---------------------------- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Financial Data
                </CardTitle>
              </CardHeader>

              <CardContent className="grid md:grid-cols-4 gap-6">

                <div>
                  <Label>Rate</Label>
                  <Input
                    type="number"
                    value={form.rate ?? ""}
                    onChange={(e) => setField("rate", Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Rate Type</Label>
                  <Input
                    value={form.rateType || ""}
                    onChange={(e) => setField("rateType", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Margin</Label>
                  <Input
                    type="number"
                    value={form.margin ?? ""}
                    onChange={(e) => setField("margin", Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Margin Type</Label>
                  <Input
                    value={form.marginType || ""}
                    onChange={(e) => setField("marginType", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Margin Paid By</Label>
                  <Input
                    value={form.marginPaidBy || ""}
                    onChange={(e) => setField("marginPaidBy", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Salary Type</Label>
                  <Input
                    value={form.salaryType || ""}
                    onChange={(e) => setField("salaryType", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Rate Cycle</Label>
                  <Input
                    value={form.rateCycle || ""}
                    onChange={(e) => setField("rateCycle", e.target.value)}
                  />
                </div>

                <div>
                  <Label>VAT Rate</Label>
                  <Input
                    type="number"
                    value={form.contractVatRate ?? ""}
                    onChange={(e) => setField("contractVatRate", Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ---------------------------- */}
            {/* 4. MSA SETTINGS */}
            {/* ---------------------------- */}
            {isMSA && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    MSA — Financial & Portal Settings
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>Fee Payer</Label>
                    <Input
                      value={form.feePayer || ""}
                      onChange={(e) => setField("feePayer", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Payroll Modes</Label>
                    <Input
                      value={form.payrollModes?.join(",") || ""}
                      onChange={(e) =>
                        setField(
                          "payrollModes",
                          e.target.value.split(",").map((s) => s.trim())
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Extra Fees</Label>
                    <Input
                      value={form.extraFees?.join(",") || ""}
                      onChange={(e) =>
                        setField(
                          "extraFees",
                          e.target.value.split(",").map((s) => s.trim())
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Deposit</Label>
                    <Switch
                      checked={form.requireDeposit || false}
                      onCheckedChange={(v) => setField("requireDeposit", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Proof of Payment</Label>
                    <Switch
                      checked={form.proofOfPayment || false}
                      onCheckedChange={(v) => setField("proofOfPayment", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Self Billing</Label>
                    <Switch
                      checked={form.selfBilling || false}
                      onCheckedChange={(v) => setField("selfBilling", v)}
                    />
                  </div>

                  <div>
                    <Label>Timesheet Policy</Label>
                    <Input
                      value={form.timesheetPolicy || ""}
                      onChange={(e) => setField("timesheetPolicy", e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>View Workers</Label>
                    <Switch
                      checked={form.portalCanViewWorkers || false}
                      onCheckedChange={(v) => setField("portalCanViewWorkers", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Upload Self Bill</Label>
                    <Switch
                      checked={form.portalCanUploadSelfBill || false}
                      onCheckedChange={(v) => setField("portalCanUploadSelfBill", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Upload Payment Proof</Label>
                    <Switch
                      checked={form.portalCanUploadPaymentProof || false}
                      onCheckedChange={(v) => setField("portalCanUploadPaymentProof", v)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ---------------------------- */}
            {/* 5. PARTICIPANTS */}
            {/* ---------------------------- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Participants
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {form.participants?.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="border p-3 rounded-md grid grid-cols-1 md:grid-cols-4 gap-4"
                  >
                    <div>
                      <Label>User ID</Label>
                      <Input
                        value={p.userId}
                        onChange={(e) => {
                          const arr = [...form.participants];
                          arr[idx].userId = e.target.value;
                          setField("participants", arr);
                        }}
                      />
                    </div>

                    <div>
                      <Label>Role</Label>
                      <Input
                        value={p.role}
                        onChange={(e) => {
                          const arr = [...form.participants];
                          arr[idx].role = e.target.value;
                          setField("participants", arr);
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        checked={p.requiresSignature}
                        onCheckedChange={(v) => {
                          const arr = [...form.participants];
                          arr[idx].requiresSignature = v;
                          setField("participants", arr);
                        }}
                      />
                      <Label>Requires Signature</Label>
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        checked={p.isPrimary}
                        onCheckedChange={(v) => {
                          const arr = [...form.participants];
                          arr[idx].isPrimary = v;
                          setField("participants", arr);
                        }}
                      />
                      <Label>Primary</Label>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() =>
                    setField("participants", [
                      ...(form.participants || []),
                      {
                        userId: "",
                        role: "",
                        requiresSignature: false,
                        isPrimary: false,
                      },
                    ])
                  }
                >
                  ➕ Add Participant
                </Button>
              </CardContent>
            </Card>

            {/* ---------------------------- */}
            {/* 6. DESCRIPTION */}
            {/* ---------------------------- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Description & Notes
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    value={form.description || ""}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    rows={3}
                    value={form.notes || ""}
                    onChange={(e) => setField("notes", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ---------------------------- */}
            {/* 7. TERMINATION */}
            {/* ---------------------------- */}
            {(form.workflowStatus === "cancelled" ||
              form.workflowStatus === "terminated") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <FileText className="h-5 w-5" />
                    Termination
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Termination Reason</Label>
                    <Textarea
                      rows={3}
                      value={form.terminationReason || ""}
                      onChange={(e) => setField("terminationReason", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Terminated At</Label>
                    <Input
                      type="date"
                      value={form.terminatedAt ? fmtDate(form.terminatedAt) : ""}
                      onChange={(e) =>
                        setField("terminatedAt", new Date(e.target.value))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ---------------------------- */}
            {/* 8. DOCUMENTS */}
            {/* ---------------------------- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Documents
                </CardTitle>
              </CardHeader>

              <CardContent>
                <DocumentListView entityType="contract" entityId={contractId} />
              </CardContent>
            </Card>

            {/* ---------------------------- */}
            {/* FOOTER */}
            {/* ---------------------------- */}
            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>

              <Button
                className="w-40"
                onClick={() => {
                  if (!form) return;

                  const { type, id: _ignore, ...safeForm } = form;

                  const payload: any = {
                    id: contractId!,
                    ...safeForm,
                    startDate: safeForm.startDate ? new Date(safeForm.startDate) : null,
                    endDate: safeForm.endDate ? new Date(safeForm.endDate) : null,
                  };

                  if (type === "msa" || type === "sow") {
                    payload.type = type;
                  }

                  updateMutation.mutate(payload);
                }}
              >
                💾 Save All Changes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
