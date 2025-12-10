"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserSelector } from "@/components/shared/UserSelector";

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: any;
  readOnly?: boolean;
}

export function InvoiceModal({
  open,
  onOpenChange,
  invoice,
  readOnly = false,
}: InvoiceModalProps) {
  const isEditing = !!invoice && !readOnly;

  // FORM
  const [form, setForm] = useState({
    invoiceNumber: "",
    contractId: "",
    senderId: "",
    receiverId: "",
    currency: "USD",
    description: "",
    notes: "",
    issueDate: "",
    dueDate: "",
    sentDate: "",
    paidDate: "",
    status: "draft",

    amount: 0,
    taxAmount: 0,
    totalAmount: 0,

    lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
    attachments: [],
  });

  // LOAD CONTRACTS
  const { data: contracts } = api.contract.getAll.useQuery(undefined, {
    enabled: !readOnly,
  });

  // FILL FORM
  useEffect(() => {
    if (invoice) {
      setForm({
        invoiceNumber: invoice.invoiceNumber ?? "",
        contractId: invoice.contractId ?? "",
        senderId: invoice.senderId ?? "",
        receiverId: invoice.receiverId ?? "",
        currency: invoice.currency ?? "USD",
        description: invoice.description ?? "",
        notes: invoice.notes ?? "",
        issueDate: format(new Date(invoice.issueDate), "yyyy-MM-dd"),
        dueDate: format(new Date(invoice.dueDate), "yyyy-MM-dd"),
        sentDate: invoice.sentDate
          ? format(new Date(invoice.sentDate), "yyyy-MM-dd")
          : "",
        paidDate: invoice.paidDate
          ? format(new Date(invoice.paidDate), "yyyy-MM-dd")
          : "",
        status: invoice.status ?? "draft",

        amount: Number(invoice.amount ?? 0),
        taxAmount: Number(invoice.taxAmount ?? 0),
        totalAmount: Number(invoice.totalAmount ?? 0),

        lineItems:
          invoice.lineItems?.map((li: any) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
          })) ?? [{ description: "", quantity: 1, unitPrice: 0 }],

        attachments: invoice.attachments ?? [],
      });
    }
  }, [invoice]);

  // TOTALS
  const subtotal = useMemo(() => {
    return form.lineItems.reduce(
      (sum, li) => sum + li.quantity * li.unitPrice,
      0
    );
  }, [form]);

  const taxAmount = subtotal * 0.0;
  const total = subtotal + taxAmount;

  // MUTATIONS
  const createMutation = api.invoice.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created");
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to create invoice"),
  });

  const updateMutation = api.invoice.update.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated");
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to update invoice"),
  });

  // SAVE
  const handleSave = () => {
    if (readOnly) return;

    const payload = {
      ...form,
      issueDate: new Date(form.issueDate),
      dueDate: new Date(form.dueDate),
      sentDate: form.sentDate ? new Date(form.sentDate) : null,
      paidDate: form.paidDate ? new Date(form.paidDate) : null,
      totalAmount: total,
      taxAmount,
      amount: subtotal,
    };

    isEditing
      ? updateMutation.mutate({ id: invoice.id, ...payload })
      : createMutation.mutate(payload);
  };

  const disabled =
    readOnly ||
    createMutation.isPending ||
    updateMutation.isPending;

  // UI
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">

        {/* HEADER */}
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex justify-between items-center text-xl">
            <span>
              {readOnly
                ? `Invoice #${form.invoiceNumber}`
                : isEditing
                ? `Edit Invoice #${form.invoiceNumber}`
                : "Create Invoice"}
            </span>

            {invoice && (
              <Badge
                variant={
                  form.status === "paid"
                    ? "default"
                    : form.status === "overdue"
                    ? "destructive"
                    : "secondary"
                }
              >
                {form.status}
              </Badge>
            )}
          </DialogTitle>

          <DialogDescription>
            {readOnly
              ? "Review invoice details"
              : "Fill the invoice information below"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-4">

          {/* SECTION — CONTRACT & GENERAL */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">General Information</h3>

            <div>
              <Label>Contract</Label>
              <Select
                disabled={disabled}
                value={form.contractId}
                onValueChange={(v) => setForm({ ...form, contractId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.contractReference} — {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <UserSelector
                label="Sender"
                placeholder="Select sender"
                value={form.senderId}
                onValueChange={(v) => setForm({ ...form, senderId: v })}
                disabled={disabled}
                required={true}
              />

              <UserSelector
                label="Receiver"
                placeholder="Select receiver"
                value={form.receiverId}
                onValueChange={(v) => setForm({ ...form, receiverId: v })}
                disabled={disabled}
                required={true}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Invoice Number</Label>
                <Input
                  disabled={disabled}
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm({ ...form, invoiceNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  disabled={disabled}
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  disabled={disabled}
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* SECTION — DATES */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  disabled={disabled}
                  value={form.issueDate}
                  onChange={(e) =>
                    setForm({ ...form, issueDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  disabled={disabled}
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sent Date</Label>
                <Input
                  type="date"
                  disabled={disabled}
                  value={form.sentDate}
                  onChange={(e) =>
                    setForm({ ...form, sentDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Paid Date</Label>
                <Input
                  type="date"
                  disabled={disabled}
                  value={form.paidDate}
                  onChange={(e) =>
                    setForm({ ...form, paidDate: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* SECTION — LINE ITEMS */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Line Items</h3>

            <div className="space-y-3">
              {form.lineItems.map((li, index) => (
                <div key={index} className="grid grid-cols-3 gap-3">
                  <Input
                    disabled={disabled}
                    value={li.description}
                    placeholder="Description"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lineItems: form.lineItems.map((x, i) =>
                          i === index
                            ? { ...x, description: e.target.value }
                            : x
                        ),
                      })
                    }
                  />

                  <Input
                    type="number"
                    disabled={disabled}
                    value={li.quantity}
                    placeholder="Qty"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lineItems: form.lineItems.map((x, i) =>
                          i === index
                            ? { ...x, quantity: Number(e.target.value) }
                            : x
                        ),
                      })
                    }
                  />

                  <Input
                    type="number"
                    disabled={disabled}
                    value={li.unitPrice}
                    placeholder="Unit Price"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lineItems: form.lineItems.map((x, i) =>
                          i === index
                            ? { ...x, unitPrice: Number(e.target.value) }
                            : x
                        ),
                      })
                    }
                  />
                </div>
              ))}

              {!readOnly && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setForm({
                      ...form,
                      lineItems: [
                        ...form.lineItems,
                        { description: "", quantity: 1, unitPrice: 0 },
                      ],
                    })
                  }
                >
                  Add line item
                </Button>
              )}
            </div>
          </section>

          <Separator />

          {/* SECTION — FINANCIAL SUMMARY */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Financial Summary</h3>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{taxAmount.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{(invoice ? form.totalAmount : total).toFixed(2)}</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* SECTION — NOTES */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Notes</h3>
            <Input
              disabled={disabled}
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
            />
          </section>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "Close" : "Cancel"}
          </Button>

          {!readOnly && (
            <Button onClick={handleSave} disabled={disabled}>
              {isEditing ? "Save Changes" : "Create Invoice"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
