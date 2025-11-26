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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";


import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Landmark } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: (data: any) => void;
};

// 🔥 FIX — Type complet du form
type MSAForm = {
  title: string;
  description: string;
  companyId: string;
  contractCountryId: string;
  currencyId: string;
  invoiceDueDays: string;

  feePayer: string;
  payrollModes: string[];
  extraFees: string[];

  requireDeposit: boolean;
  proofOfPayment: boolean;
  selfBilling: boolean;

  timesheetPolicy: string;

  portalCanViewWorkers: boolean;
  portalCanUploadSelfBill: boolean;
  portalCanUploadPaymentProof: boolean;
};

export function MSACreateModal({ open, onOpenChange, onSuccess }: Props) {
  // -------------------------------------------------------------
  // FORM STATE (Tipé correctement)
  // -------------------------------------------------------------
  const [form, setForm] = useState<MSAForm>({
    title: "",
    description: "",
    companyId: "",
    contractCountryId: "",
    currencyId: "",
    invoiceDueDays: "30",

    feePayer: "client",
    payrollModes: ["employed"],
    extraFees: [],

    requireDeposit: false,
    proofOfPayment: false,
    selfBilling: false,

    timesheetPolicy: "required",

    portalCanViewWorkers: true,
    portalCanUploadSelfBill: true,
    portalCanUploadPaymentProof: true,
  });

  // 🔥 REMOVED — Admin and Approver will be assigned later by admins
  // const [clientAdminId, setClientAdminId] = useState("");
  // const [approverId, setApproverId] = useState("");
  

  // -------------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------------
  const isValid =
    form.title.trim() &&
    form.companyId &&
    form.contractCountryId &&
    form.currencyId;

  // -------------------------------------------------------------
  // LOAD DATA
  // -------------------------------------------------------------
  const companies = api.company.getAll.useQuery();
  // const users = api.user.getAll.useQuery(); // 🔥 REMOVED - users will be assigned later
  const currencies = api.currency.getAll.useQuery();
  const countries = api.country.getAll.useQuery();
  // USER ACTUEL
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";


  // -------------------------------------------------------------
  // CREATE MUTATION
  // -------------------------------------------------------------
  const create = api.contract.create.useMutation({
    onSuccess: async (res) => {
      toast.success("MSA créé avec succès");
      onSuccess?.(res);
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // -------------------------------------------------------------
  // HANDLE CREATE
  // -------------------------------------------------------------
  const handleCreate = () => {
    if (!isValid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    create.mutate({
      type: "msa",
      parentId: null,

      title: form.title,
      description: form.description,
      companyId: form.companyId,
      contractCountryId: form.contractCountryId,
      currencyId: form.currencyId,
      invoiceDueDays: Number(form.invoiceDueDays),

      feePayer: form.feePayer,
      payrollModes: form.payrollModes,
      extraFees: form.extraFees,

      requireDeposit: form.requireDeposit,
      proofOfPayment: form.proofOfPayment,
      selfBilling: form.selfBilling,

      timesheetPolicy: form.timesheetPolicy,

      portalCanViewWorkers: form.portalCanViewWorkers,
      portalCanUploadSelfBill: form.portalCanUploadSelfBill,
      portalCanUploadPaymentProof: form.portalCanUploadPaymentProof,

      // 🔥 NEW — Admin and Approver will be assigned later by platform admins
      // For now, only add the creator as a client participant
      participants: [
        {
          userId: currentUserId,
          role: "client",
          requiresSignature: false,
          isPrimary: true,
        },
      ],
    });
  };

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Landmark className="h-5 w-5 text-blue-600" />
            Nouveau MSA (Master Service Agreement)
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
          Une fois le MSA créé, vous pourrez <b>ajouter le contrat PDF</b> depuis
          la page de détail du MSA.
        </div>

        {/* FORM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

          {/* TITLE */}
          <div className="col-span-2">
            <Label>Titre du MSA *</Label>
            <Input
              placeholder="Ex: MSA – Prestations Tech 2025"
              value={form.title}
              onChange={(e) =>
                setForm((s) => ({ ...s, title: e.target.value }))
              }
            />
          </div>

          {/* COMPANY */}
          <div>
            <Label>Entreprise (Client) *</Label>
            <Select
              value={form.companyId}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, companyId: v }))
              }
            >
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
            <Label>Pays du contrat *</Label>
            <Select
              value={form.contractCountryId}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, contractCountryId: v }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {countries.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CURRENCY */}
          <div>
            <Label>Devise *</Label>
            <Select
              value={form.currencyId}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, currencyId: v }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {currencies.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PAY DELAY */}
          <div>
            <Label>Délai de paiement (jours)</Label>
            <Input
              type="number"
              value={form.invoiceDueDays}
              onChange={(e) =>
                setForm((s) => ({ ...s, invoiceDueDays: e.target.value }))
              }
            />
          </div>

          {/* DESCRIPTION */}
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Objet du MSA, périmètre des prestations, obligations..."
              className="min-h-[100px]"
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
            />
          </div>

          {/* ---------- FINANCIAL SETTINGS ---------- */}

          <div className="col-span-2 border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-2">Paramètres Financiers</h3>

            {/* Fee payer */}
            <Label>Qui paie les frais ? *</Label>
            <Select
              value={form.feePayer}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, feePayer: v }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
              </SelectContent>
            </Select>

            {/* Payroll Modes */}
            <div className="mt-4">
              <Label>Modes Payroll autorisés *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["employed", "gross", "split"].map((mode) => {
                  const active = form.payrollModes.includes(mode);
                  return (
                    <Badge
                      key={mode}
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          payrollModes: active
                            ? s.payrollModes.filter((m) => m !== mode)
                            : [...s.payrollModes, mode],
                        }))
                      }
                      className={`cursor-pointer ${
                        active ? "bg-blue-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      {mode}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Extra Fees */}
            <div className="mt-4">
              <Label>Frais additionnels</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["visa", "annual_tax", "onboarding"].map((fee) => {
                  const active = form.extraFees.includes(fee);
                  return (
                    <Badge
                      key={fee}
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          extraFees: active
                            ? s.extraFees.filter((f) => f !== fee)
                            : [...s.extraFees, fee],
                        }))
                      }
                      className={`cursor-pointer ${
                        active ? "bg-purple-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      {fee}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* ---------- SWITCHES ---------- */}
            <div className="grid grid-cols-2 gap-4 mt-4">

              <div className="flex items-center justify-between">
                <Label>Self Billing</Label>
                <Switch
                  checked={form.selfBilling}
                  onCheckedChange={(v) =>
                    setForm((s) => ({ ...s, selfBilling: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Proof of Payment requis</Label>
                <Switch
                  checked={form.proofOfPayment}
                  onCheckedChange={(v) =>
                    setForm((s) => ({ ...s, proofOfPayment: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Deposit requis</Label>
                <Switch
                  checked={form.requireDeposit}
                  onCheckedChange={(v) =>
                    setForm((s) => ({ ...s, requireDeposit: v }))
                  }
                />
              </div>

              <div>
                <Label>Politique Timesheet *</Label>
                <Select
                  value={form.timesheetPolicy}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, timesheetPolicy: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Obligatoire</SelectItem>
                    <SelectItem value="optional">Optionnel</SelectItem>
                    <SelectItem value="not_used">Non utilisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>

          {/* ---------- PORTAL PERMISSIONS ---------- */}

          <div className="col-span-2 border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-2">
              Permissions Portail Client
            </h3>

            <div className="grid grid-cols-2 gap-4">

              <div className="flex items-center justify-between">
                <Label>Voir les contractors</Label>
                <Switch
                  checked={form.portalCanViewWorkers}
                  onCheckedChange={(v) =>
                    setForm((s) => ({ ...s, portalCanViewWorkers: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Uploader self-bill</Label>
                <Switch
                  checked={form.portalCanUploadSelfBill}
                  onCheckedChange={(v) =>
                    setForm((s) => ({ ...s, portalCanUploadSelfBill: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Uploader preuve de paiement</Label>
                <Switch
                  checked={form.portalCanUploadPaymentProof}
                  onCheckedChange={(v) =>
                    setForm((s) => ({ ...s, portalCanUploadPaymentProof: v }))
                  }
                />
              </div>

            </div>
          </div>

          {/* ---------- TENANT INFO MESSAGE ---------- */}

          <div className="col-span-2 border-t pt-4 mt-4">
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
                    Ce MSA sera lié au <strong>tenant (plateforme)</strong>. Les administrateurs 
                    de la plateforme pourront ensuite assigner un <strong>Admin principal</strong> et 
                    un <strong>Approver</strong> spécifiques à ce contrat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- FOOTER ---------- */}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>

          <Button
            disabled={!isValid || create.isPending}
            onClick={handleCreate}
          >
            {create.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Créer le MSA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
