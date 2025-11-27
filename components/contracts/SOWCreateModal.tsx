"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";

import { api } from "@/lib/trpc";
import { toast } from "sonner";

// ============================================================
// ⭐ TYPES STRICTS
// ============================================================

export const RATE_TYPES = ["hourly", "daily", "monthly", "fixed"] as const;
export type RateType = (typeof RATE_TYPES)[number];

type SOWForm = {
  title: string;
  description: string;
  companyId: string;
  contractCountryId: string;
  currencyId: string;
  startDate: string;
  endDate: string;
  rate: string;
  rateType: RateType;
  payrollMode: string;
  invoiceDueDays: string;
  extraFees: string[];
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: (data: any) => void;
};

// ============================================================
// ⭐ MODAL
// ============================================================

export function SOWCreateModal({ open, onOpenChange, onSuccess }: Props) {
  const { data: session } = useSession();
    const currentUserId = session?.user?.id || "";

  // FORM STATE
  const [form, setForm] = useState<SOWForm>({
    title: "",
    description: "",
    companyId: "",
    contractCountryId: "",
    currencyId: "",
    startDate: "",
    endDate: "",
    rate: "",
    rateType: "hourly",
    payrollMode: "employed",
    invoiceDueDays: "30",
    extraFees: [],
    notes: "",
  });

  // Worker selection
  const [workerId, setWorkerId] = useState("");

  // Parent MSA selection
  const [parentMSAId, setParentMSAId] = useState("");

  // ============================================================
  // LOAD DATA
  // ============================================================

  const msas = api.contract.getAll.useQuery({ type: "msa" });
  const users = api.user.getAll.useQuery();
  const companies = api.company.getAll.useQuery();
  const countries = api.country.getAll.useQuery();
  const currencies = api.currency.getAll.useQuery();

  // ============================================================
  // VALIDATION
  // ============================================================

  const isValid =
    form.title &&
    parentMSAId &&
    workerId &&
    form.companyId &&
    form.contractCountryId &&
    form.currencyId &&
    form.startDate &&
    form.rate;

  // ============================================================
  // CREATE MUTATION
  // ============================================================

  const create = api.contract.create.useMutation({
    onSuccess: (res) => {
      toast.success("SOW créé avec succès");
      onSuccess?.(res);
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // ============================================================
  // HANDLE CREATE
  // ============================================================

  const handleCreate = () => {
    if (!isValid) return toast.error("Veuillez remplir les champs obligatoires.");

    const msaData = msas.data?.find((m) => m.id === parentMSAId);
    if (!msaData) return toast.error("MSA parent introuvable.");

    // 🔥 NEW — No longer require client_admin and approver from parent MSA
    // They will be assigned later by platform admins
    // const clientAdmin = msaData.participants.find((p) => p.role === "client_admin");
    // const approver = msaData.participants.find((p) => p.role === "approver");
    // if (!clientAdmin || !approver)
    //   return toast.error("Le MSA parent est invalide : pas d'admin ou d'approver.");

    create.mutate({
      type: "sow",
      parentId: parentMSAId,

      title: form.title,
      description: form.description,
      companyId: form.companyId,
      contractCountryId: form.contractCountryId,
      currencyId: form.currencyId,

      startDate: new Date(form.startDate),
      endDate: form.endDate ? new Date(form.endDate) : null,

      rate: Number(form.rate),
      rateType: form.rateType,

      payrollModes: [form.payrollMode],
      invoiceDueDays: Number(form.invoiceDueDays),
      extraFees: form.extraFees,
      notes: form.notes,

      // 🔥 NEW — Admin and Approver will be assigned later by platform admins
      // For now, only add the worker and the creator (linked to the company)
      participants: [
        {
          userId: workerId,
          role: "contractor",
          requiresSignature: true,
          isPrimary: true,
        },
        {
          userId: currentUserId,
          companyId: form.companyId, // 🔥 Lier l'utilisateur à la company sélectionnée
          role: "client",
          requiresSignature: false,
        },
      ],
    });
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-purple-600" />
            Nouveau SOW (Statement of Work)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-md text-sm">
            Ce SOW sera lié au MSA parent et contiendra les détails opérationnels de la mission.
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">
                  Contrat envoyé à la plateforme
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Ce SOW sera lié au <strong>tenant (plateforme)</strong>. Les administrateurs 
                  de la plateforme pourront ensuite assigner un <strong>Admin principal</strong> et 
                  un <strong>Approver</strong> spécifiques à ce contrat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FORM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

          {/* MSA Parent */}
          <div className="col-span-2">
            <Label>MSA parent *</Label>
            <Select value={parentMSAId} onValueChange={setParentMSAId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un MSA" /></SelectTrigger>
              <SelectContent>
                {msas.data?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Worker */}
          <div className="col-span-2">
            <Label>Contractor (Worker) *</Label>
            <Select value={workerId} onValueChange={setWorkerId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un worker" /></SelectTrigger>
              <SelectContent>
                {users.data?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TITLE */}
          <div className="col-span-2">
            <Label>Titre *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : SOW – Développeur Frontend – 2025"
            />
          </div>

          {/* COMPANY */}
          <div>
            <Label>Entreprise (Client) *</Label>
            <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {companies.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* COUNTRY */}
          <div>
            <Label>Pays *</Label>
            <Select value={form.contractCountryId} onValueChange={(v) => setForm({ ...form, contractCountryId: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {countries.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DATES */}
          <div>
            <Label>Date de début *</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>

          <div>
            <Label>Date de fin</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          {/* RATE */}
          <div>
            <Label>Rate *</Label>
            <Input
              type="number"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              placeholder="Ex : 100"
            />
          </div>

          {/* RATE TYPE */}
          <div>
            <Label>Type de rate *</Label>
            <Select
              value={form.rateType}
              onValueChange={(v: RateType) => setForm({ ...form, rateType: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Horaire</SelectItem>
                <SelectItem value="daily">Journalier</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="fixed">Fixe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CURRENCY */}
          <div>
            <Label>Devise *</Label>
            <Select value={form.currencyId} onValueChange={(v) => setForm({ ...form, currencyId: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {currencies.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PAYROLL MODE */}
          <div>
            <Label>Mode payroll *</Label>
            <Select value={form.payrollMode} onValueChange={(v) => setForm({ ...form, payrollMode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="gross">Gross</SelectItem>
                <SelectItem value="split">Split</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* EXTRA FEES */}
          <div className="col-span-2">
            <Label>Frais additionnels</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {["visa", "annual_tax", "onboarding"].map((fee) => {
                const active = form.extraFees.includes(fee);
                return (
                  <Badge
                    key={fee}
                    onClick={() =>
                      setForm({
                        ...form,
                        extraFees: active
                          ? form.extraFees.filter((f) => f !== fee)
                          : [...form.extraFees, fee],
                      })
                    }
                    className={
                      active
                        ? "bg-purple-600 text-white cursor-pointer"
                        : "bg-gray-200 cursor-pointer"
                    }
                  >
                    {fee}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea
              className="min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Détails de la mission, livrables..."
            />
          </div>

          {/* NOTES */}
          <div className="col-span-2">
            <Label>Notes internes</Label>
            <Textarea
              className="min-h-[80px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes internes (Aspirock uniquement)"
            />
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>

          <Button disabled={!isValid || create.isPending} onClick={handleCreate}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer le SOW
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
