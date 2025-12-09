"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip?: any;
  onSuccess?: () => void;
}

const MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

export function PayslipModal({
  open,
  onOpenChange,
  payslip,
  onSuccess,
}: PayslipModalProps) {
  const utils = api.useContext();

  // --------------------------
  // LOAD USERS (CONTRACTORS)
  // --------------------------
  const { data: users } = api.user.getAll.useQuery(); 
  // 👆 NOTE : Je t’explique plus bas comment ajouter cette route

  const { data: contracts } = api.contract.getAll.useQuery();

  const [isLoading, setIsLoading] = useState(false);

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
      toast.success("Payslip créé");
      utils.payslip.getAll.invalidate();
      utils.payslip.getStats.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = api.payslip.update.useMutation({
    onSuccess: () => {
      toast.success("Payslip mis à jour");
      utils.payslip.getAll.invalidate();
      utils.payslip.getStats.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  // --------------------------
  // SUBMIT
  // --------------------------
  async function handleSubmit(e: any) {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.userId) {
      toast.error("Veuillez sélectionner un utilisateur");
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
      } else {
        await createMutation.mutateAsync({
          ...formData,
          contractId: formData.contractId === "none" ? undefined : formData.contractId,
          sentDate: formData.sentDate || undefined,
          paidDate: formData.paidDate || undefined,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payslip ? "Modifier le payslip" : "Créer un nouveau payslip"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USER */}
          <div className="space-y-2">
            <Label>Utilisateur *</Label>
            <Select
              value={formData.userId}
              onValueChange={(v) => setFormData({ ...formData, userId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un utilisateur" />
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
            <Label>Contrat (optionnel)</Label>
            <Select
              value={formData.contractId}
              onValueChange={(v) =>
                setFormData({ ...formData, contractId: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un contrat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {contracts?.map((c) => (
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
              <Label>Année</Label>
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
              <Label>Déductions</Label>
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
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="generated">Généré</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date d’envoi</Label>
              <Input
                type="date"
                value={formData.sentDate}
                onChange={(e) =>
                  setFormData({ ...formData, sentDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Date de paiement</Label>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {payslip ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
