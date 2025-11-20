// ------------------------------------------------------------
// SUPER CONTRACT MODAL (DEEL STYLE) — v1
// ------------------------------------------------------------
// Inclus :
// - Tous les champs du modèle Contract
// - Gestion complète ContractParticipant[]
// - Workflow DEEL
// - UI Pro avec Tabs
// ------------------------------------------------------------

"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FileText, Users } from "lucide-react";


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
// COMPONENT
// ------------------------------------------------------------
export function ContractModal({ open, onOpenChange, contract, onSuccess }: any) {

  // ------------------------------------------------------------
  // FORM DATA CONTRACT
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

  // ------------------------------------------------------------
  // PARTICIPANTS
  // ------------------------------------------------------------
  const [participants, setParticipants] = useState<ParticipantForm[]>([]);


  // ------------------------------------------------------------
  // FETCH DATA
  // ------------------------------------------------------------
  const { data: users = [] } = api.user.getAll.useQuery();
  const { data: countries = [] } = api.country.getAll.useQuery();
  const { data: currencies = [] } = api.currency.getAll.useQuery();
  const { data: banks = [] } = api.bank.getAll.useQuery();


  // ------------------------------------------------------------
  // INITIALISE FORM WHEN EDITING
  // ------------------------------------------------------------
  useEffect(() => {
    if (!contract) return;

    const fixWorkflow = (value: string | null | undefined) => {
      if (!value) return "draft";

      if (value === "pending_signatures") {
        return "pending_agency_sign";
      }

      // Et si jamais futur anciens workflows apparaissent
      const allowed = [
        "draft",
        "pending_agency_sign",
        "pending_contractor_sign",
        "active",
        "paused",
        "terminated",
        "completed",
        "cancelled"
      ];

      return allowed.includes(value) ? value : "draft";
    };


    setForm({
      title: contract.title || "",
      description: contract.description || "",
      notes: contract.notes || "",
      status: contract.status || "draft",
      workflowStatus: fixWorkflow(contract.workflowStatus),
      contractReference: contract.contractReference || "",
      contractCountryId: contract.contractCountryId || "",
      contractVatRate: contract.contractVatRate?.toString() || "",
      currencyId: contract.currencyId || "",
      bankId: contract.bankId || "",
      rate: contract.rate?.toString() || "",
      rateType: contract.rateType || "hourly",
      rateCycle: contract.rateCycle || "monthly",
      margin: contract.margin?.toString() || "",
      marginType: contract.marginType || "percentage",
      marginPaidBy: contract.marginPaidBy || "client",
      salaryType: contract.salaryType || "gross",
      invoiceDueDays: contract.invoiceDueDays?.toString() || "",
      companyId: contract.companyId || "",
      assignedTo: contract.assignedTo || "",
      startDate: contract.startDate ? new Date(contract.startDate).toISOString().split("T")[0] : "",
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split("T")[0] : "",
      signedAt: contract.signedAt ? new Date(contract.signedAt).toISOString().split("T")[0] : "",
      terminatedAt: contract.terminatedAt ? new Date(contract.terminatedAt).toISOString().split("T")[0] : "",
      terminationReason: contract.terminationReason || "",
      signedContractPath: contract.signedContractPath || "",
    });

    setParticipants(
      contract.participants?.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        requiresSignature: p.requiresSignature,
        isPrimary: p.isPrimary,
        isActive: p.isActive,
        signedAt: p.signedAt ? new Date(p.signedAt).toISOString().split("T")[0] : "",
        signatureUrl: p.signatureUrl || "",
      })) || []
    );

  }, [contract]);



  // ------------------------------------------------------------
  // MUTATIONS
  // ------------------------------------------------------------
  const createMutation = api.contract.create.useMutation();
  const updateMutation = api.contract.update.useMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;


  // ------------------------------------------------------------
  // ADD PARTICIPANT
  // ------------------------------------------------------------
  const addParticipant = () => {
    setParticipants([
      ...participants,
      {
        userId: "",
        role: "",
        requiresSignature: false,
        isPrimary: false,
        isActive: true,
      },
    ]);
  };


  // ------------------------------------------------------------
  // REMOVE PARTICIPANT
  // ------------------------------------------------------------
  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };


  // ------------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------------
  const handleSubmit = () => {

    const payload = {
      title: form.title || undefined,
      description: form.description || undefined,
      notes: form.notes || undefined,

      status: (form.status as
        "draft" |
        "active" |
        "completed" |
        "cancelled" |
        "paused") || undefined,

      workflowStatus: (form.workflowStatus as
        | "draft"
        | "pending_agency_sign"
        | "pending_contractor_sign"
        | "active"
        | "paused"
        | "terminated"
        | "completed"
        | "cancelled"
      ) || undefined,


      contractReference: form.contractReference || undefined,
      contractCountryId: form.contractCountryId || undefined,

      contractVatRate: form.contractVatRate
        ? parseFloat(form.contractVatRate)
        : undefined,

      currencyId: form.currencyId || undefined,
      bankId: form.bankId || undefined,

      rate: form.rate ? parseFloat(form.rate) : undefined,
      rateType: form.rateType as "hourly" | "daily" | "monthly" | "fixed" | undefined,
      rateCycle: form.rateCycle || undefined,

      margin: form.margin ? parseFloat(form.margin) : undefined,
      marginType: form.marginType as "percentage" | "fixed" | undefined,
      marginPaidBy: form.marginPaidBy as "client" | "contractor" | undefined,

      salaryType: form.salaryType || undefined,
      invoiceDueDays: form.invoiceDueDays
        ? parseInt(form.invoiceDueDays)
        : undefined,

      companyId: form.companyId || undefined,
      assignedTo: form.assignedTo || undefined,

      startDate: form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      signedAt: form.signedAt ? new Date(form.signedAt) : undefined,
      terminatedAt: form.terminatedAt ? new Date(form.terminatedAt) : undefined,
      terminationReason: form.terminationReason || undefined,

      signedContractPath: form.signedContractPath || undefined,

      participants: participants.map((p) => ({
        id: p.id || undefined,
        userId: p.userId,
        role: p.role,
        requiresSignature: !!p.requiresSignature,
        isPrimary: !!p.isPrimary,
        isActive: !!p.isActive,
        signatureUrl: p.signatureUrl || undefined,
        signedAt: p.signedAt ? new Date(p.signedAt) : undefined,
      })),
    };

    if (contract) {
      updateMutation.mutate(
        { id: contract.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Contract updated");
            onSuccess?.();
            onOpenChange(false);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Contract created");
          onSuccess?.();
          onOpenChange(false);
        },
      });
    }
  };


  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? "Edit Contract" : "Create Contract"}</DialogTitle>
          <DialogDescription>DEEL-style contract management</DialogDescription>
        </DialogHeader>

        {/* ======================= */}
        {/*        TABS UI          */}
        {/* ======================= */}
        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="dates">Dates</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="documents">Docs</TabsTrigger>
          </TabsList>


          {/* ---------------------------------- */}
          {/* GENERAL TAB                        */}
          {/* ---------------------------------- */}
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Workflow</Label>
                <Select value={form.workflowStatus} onValueChange={(v) => setForm({ ...form, workflowStatus: v })}>
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
                <Input value={form.contractReference} onChange={(e) => setForm({ ...form, contractReference: e.target.value })}/>
              </div>
            </div>


            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}/>
            </div>
          </TabsContent>



          {/* ---------------------------------- */}
          {/* FINANCIAL TAB                     */}
          {/* ---------------------------------- */}
          <TabsContent value="financial" className="space-y-4 pt-4">

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Rate</Label>
                <Input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })}/>
              </div>

              <div>
                <Label>Rate Type</Label>
                <Select value={form.rateType} onValueChange={(v) => setForm({ ...form, rateType: v })}>
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
                <Label>Cycle</Label>
                <Select value={form.rateCycle} onValueChange={(v) => setForm({ ...form, rateCycle: v })}>
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
                <Input value={form.margin} onChange={(e) => setForm({ ...form, margin: e.target.value })}/>
              </div>

              <div>
                <Label>Margin Type</Label>
                <Select value={form.marginType} onValueChange={(v) => setForm({ ...form, marginType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Margin Paid By</Label>
                <Select value={form.marginPaidBy} onValueChange={(v) => setForm({ ...form, marginPaidBy: v })}>
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
                <Select value={form.currencyId} onValueChange={(v) => setForm({ ...form, currencyId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bank</Label>
                <Select value={form.bankId} onValueChange={(v) => setForm({ ...form, bankId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>VAT (%)</Label>
                <Input value={form.contractVatRate} onChange={(e) => setForm({ ...form, contractVatRate: e.target.value })}/>
              </div>
            </div>

          </TabsContent>


          {/* ---------------------------------- */}
          {/* DATES TAB                          */}
          {/* ---------------------------------- */}
          <TabsContent value="dates" className="space-y-4 pt-4">

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}/>
              </div>

              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}/>
              </div>

              <div>
                <Label>Signed At</Label>
                <Input type="date" value={form.signedAt} onChange={(e) => setForm({ ...form, signedAt: e.target.value })}/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Terminated At</Label>
                <Input type="date" value={form.terminatedAt} onChange={(e) => setForm({ ...form, terminatedAt: e.target.value })}/>
              </div>

              <div>
                <Label>Termination Reason</Label>
                <Textarea rows={2} value={form.terminationReason} onChange={(e) => setForm({ ...form, terminationReason: e.target.value })}/>
              </div>
            </div>

          </TabsContent>


          {/* ---------------------------------- */}
          {/* PARTICIPANTS TAB                  */}
          {/* ---------------------------------- */}
          <TabsContent value="participants">
            <div className="pt-4 space-y-6">

              <Button onClick={addParticipant} variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Participant
              </Button>

              {participants.map((p, i) => (
                <div key={i} className="border p-4 rounded-lg space-y-4">

                  <div className="flex justify-between items-center">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" /> Participant {i + 1}
                    </h4>
                    <Button variant="ghost" onClick={() => removeParticipant(i)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>User</Label>
                      <Select
                        value={p.userId}
                        onValueChange={(v) => {
                          const updated = [...participants];
                          updated[i].userId = v;
                          setParticipants(updated);
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Role</Label>
                      <Select
                        value={p.role}
                        onValueChange={(v) => {
                          const updated = [...participants];
                          updated[i].role = v;
                          setParticipants(updated);
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
                          const updated = [...participants];
                          updated[i].isActive = v === "yes";
                          setParticipants(updated);
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
                          const updated = [...participants];
                          updated[i].isPrimary = v === "yes";
                          setParticipants(updated);
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
                          const updated = [...participants];
                          updated[i].requiresSignature = v === "yes";
                          setParticipants(updated);
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
                          const updated = [...participants];
                          updated[i].signedAt = e.target.value;
                          setParticipants(updated);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Signature URL</Label>
                    <Input
                      value={p.signatureUrl || ""}
                      onChange={(e) => {
                        const updated = [...participants];
                        updated[i].signatureUrl = e.target.value;
                        setParticipants(updated);
                      }}
                    />
                  </div>

                </div>
              ))}
            </div>
          </TabsContent>



          {/* ---------------------------------- */}
          {/* DOCUMENTS TAB                     */}
          {/* ---------------------------------- */}
          <TabsContent value="documents" className="pt-4 space-y-4">

            <div className="space-y-2">
              <Label>Signed Contract (PDF)</Label>
              <Input
                type="text"
                placeholder="URL or path"
                value={form.signedContractPath}
                onChange={(e) => setForm({ ...form, signedContractPath: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                DEEL stocke les PDF en storage + preview. Tu peux faire pareil.
              </p>
            </div>

          </TabsContent>


        </Tabs>


        {/* ---------------------- */}
        {/*       FOOTER           */}
        {/* ---------------------- */}
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {contract ? "Update Contract" : "Create Contract"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
