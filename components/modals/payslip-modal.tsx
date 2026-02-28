"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/trpc";
import { Loader2, FileText, X, Upload, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DocumentList } from "@/components/documents/DocumentList";

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip?: any;
  onSuccess?: () => void;
  mode?: "view" | "edit";
  onModeChange?: (mode: "view" | "edit") => void;
}

const MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "February" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "August" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "December" },
];

export function PayslipModal({
  open,
  onOpenChange,
  payslip,
  onSuccess,
  mode = "edit",
  onModeChange,
}: PayslipModalProps) {
  const isViewMode = mode === "view";
  const utils = api.useContext();
  const { data: session } = useSession();

  // CHECK PERMISSIONS
  const permissions = session?.user?.permissions ?? [];
  const CAN_LIST_GLOBAL = permissions.includes("contract.list.global");
  const CAN_READ_OWN = permissions.includes("contract.read.own");

  // --------------------------
  // LOAD USERS (CONTRACTORS)
  // --------------------------
  const { data: users } = api.user.getAll.useQuery();

  // LOAD CONTRACTS - Use conditional queries based on permissions
  const globalQuery = api.contract.getAll.useQuery(undefined, {
    enabled: CAN_LIST_GLOBAL,
  });

  const ownQuery = api.contract.getMyContracts.useQuery(undefined, {
    enabled: CAN_READ_OWN && !CAN_LIST_GLOBAL,
  });

  // MERGE CONTRACT RESULTS
  const contracts = useMemo(() => {
    if (CAN_LIST_GLOBAL) return globalQuery.data ?? [];
    if (CAN_READ_OWN) return ownQuery.data ?? [];
    return [];
  }, [CAN_LIST_GLOBAL, CAN_READ_OWN, globalQuery.data, ownQuery.data]);

  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    userId: "",
    contractId: "none",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    grossPay: 0,
    netPay: 0,
    deductions: 0,
    tax: 0,
    status: "pending" as "pending" | "generated" | "sent" | "paid",
    sentDate: "",
    paidDate: "",
    notes: "",
  });

  // --------------------------
  // PREFILL ON OPEN / EDIT
  // --------------------------
  useEffect(() => {
    if (payslip) {
      setFormData({
        userId: payslip.userId || "",
        contractId: payslip.contractId ? payslip.contractId : "none",
        month: payslip.month,
        year: payslip.year,
        grossPay: payslip.grossPay,
        netPay: payslip.netPay,
        deductions: payslip.deductions,
        tax: payslip.tax,
        status: payslip.status,
        sentDate: payslip.sentDate
          ? new Date(payslip.sentDate).toISOString().split("T")[0]
          : "",
        paidDate: payslip.paidDate
          ? new Date(payslip.paidDate).toISOString().split("T")[0]
          : "",
        notes: payslip.notes || "",
      });
    } else {
      setFormData({
        userId: "",
        contractId: "none",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        grossPay: 0,
        netPay: 0,
        deductions: 0,
        tax: 0,
        status: "pending",
        sentDate: "",
        paidDate: "",
        notes: "",
      });
    }
  }, [payslip, open]);

  // --------------------------
  // MUTATIONS
  // --------------------------
  const createMutation = api.payslip.create.useMutation({
    onSuccess: () => {
      toast.success("Payslip created");
      utils.payslip.getAll.invalidate();
      utils.payslip.getStats.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = api.payslip.update.useMutation({
    onSuccess: () => {
      toast.success("Payslip updated");
      utils.payslip.getAll.invalidate();
      utils.payslip.getStats.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  // Document upload mutation
  const uploadDocMutation = api.document.upload.useMutation();

  const uploadDocument = async (payslipId: string) => {
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    await uploadDocMutation.mutateAsync({
      entityType: "payslip",
      entityId: payslipId,
      fileName: file.name,
      buffer: base64,
      mimeType: file.type,
      fileSize: file.size,
      category: "payslip",
      description: "Payslip document",
    });
  };

  // --------------------------
  // SUBMIT
  // --------------------------
  async function handleSubmit(e: any) {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.userId) {
      toast.error("Please select a user");
      setIsLoading(false);
      return;
    }

    try {
      if (payslip) {
        await updateMutation.mutateAsync({
          id: payslip.id,
          ...formData,
          contractId: formData.contractId === "none" ? undefined : formData.contractId,
          sentDate: formData.sentDate || undefined,
          paidDate: formData.paidDate || undefined,
        });

        // Upload file if provided (for existing payslip)
        if (file) {
          try {
            await uploadDocument(payslip.id);
            toast.success("Document uploaded!");
          } catch (error) {
            toast.warning("Payslip updated but document upload failed.");
          }
        }
      } else {
        const result = await createMutation.mutateAsync({
          ...formData,
          contractId: formData.contractId === "none" ? undefined : formData.contractId,
          sentDate: formData.sentDate || undefined,
          paidDate: formData.paidDate || undefined,
        });

        // Upload file if provided
        if (file && result?.id) {
          try {
            await uploadDocument(result.id);
          } catch (error) {
            toast.warning("Payslip created but document upload failed.");
          }
        }
      }
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isViewMode ? "Payslip Details" : payslip ? "Edit payslip" : "Create new payslip"}
          </DialogTitle>
        </DialogHeader>

        {isViewMode ? (
          /* VIEW MODE */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-1 space-y-4">
              {/* USER */}
              <div className="border rounded-lg p-3 bg-muted/40">
                <p className="text-xs text-muted-foreground">User</p>
                <p className="font-semibold">
                  {payslip?.user?.name || payslip?.user?.email || "N/A"}
                </p>
              </div>

              {/* PERIOD & STATUS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="font-semibold">
                    {MONTHS.find((m) => m.value === formData.month)?.label} {formData.year}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant="secondary"
                    className={
                      formData.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : formData.status === "sent"
                        ? "bg-blue-100 text-blue-700"
                        : formData.status === "generated"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {formData.status}
                  </Badge>
                </div>
              </div>

              {/* FINANCIAL */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Salaire brut</p>
                  <p className="font-bold text-lg">${formData.grossPay}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Salaire net</p>
                  <p className="font-bold text-lg text-emerald-600">${formData.netPay}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="font-semibold">${formData.deductions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxes</p>
                  <p className="font-semibold">${formData.tax}</p>
                </div>
              </div>

              {/* DATES */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date d'envoi</p>
                  <p>{formData.sentDate || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment date</p>
                  <p>{formData.paidDate || "N/A"}</p>
                </div>
              </div>

              {/* NOTES */}
              {formData.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{formData.notes}</p>
                </div>
              )}

              {/* DOCUMENTS */}
              {payslip && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Attached Documents
                  </Label>
                  <DocumentList entityType="payslip" entityId={payslip.id} />
                </div>
              )}
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onModeChange && (
                <Button type="button" onClick={() => onModeChange("edit")}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-1 space-y-4">
            {/* USER */}
            <div className="space-y-2">
              <Label>User *</Label>
              <Select
                value={formData.userId}
                onValueChange={(v) => setFormData({ ...formData, userId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CONTRACT */}
            <div className="space-y-2">
              <Label>Contract (optional)</Label>
              <Select
                value={formData.contractId}
                onValueChange={(v) =>
                  setFormData({ ...formData, contractId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title || c.contractReference || c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* MONTH + YEAR */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mois</Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(v) =>
                    setFormData({ ...formData, month: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  min="2020"
                  max="2100"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: parseInt(e.target.value) || new Date().getFullYear(),
                    })
                  }
                />
              </div>
            </div>

            {/* FINANCIAL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Salaire brut</Label>
                <Input
                  type="number"
                  value={formData.grossPay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grossPay: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label>Salaire net</Label>
                <Input
                  type="number"
                  value={formData.netPay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      netPay: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label>Deductions</Label>
                <Input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deductions: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label>Taxes</Label>
                <Input
                  type="number"
                  value={formData.tax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tax: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* STATUS */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v: any) =>
                  setFormData({ ...formData, status: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DATES */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date d'envoi</Label>
                <Input
                  type="date"
                  value={formData.sentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, sentDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Payment date</Label>
                <Input
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paidDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            {/* FILE UPLOAD */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Payslip Document
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>

            {/* EXISTING DOCUMENTS */}
            {payslip && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Attached Documents
                </Label>
                <DocumentList
                  entityType="payslip"
                  entityId={payslip.id}
                />
              </div>
            )}
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {payslip ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}