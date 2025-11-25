"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, UserPlus, X, FileText, Users, CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: (data: any) => void;
};

type Participant = {
  id: string; // temporary id for UI
  userId: string;
  role: string;
  requiresSignature: boolean;
  isPrimary: boolean;
};

type ContractForm = {
  title: string;
  description: string;
  companyId: string;
  contractCountryId: string;
  currencyId: string;
  rate: string;
  rateType: string;
  startDate: string;
  endDate: string;
  invoiceDueDays: string;
};

export function NormalContractCreateModal({ open, onOpenChange, onSuccess }: Props) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";

  // Form state
  const [form, setForm] = useState<ContractForm>({
    title: "",
    description: "",
    companyId: "",
    contractCountryId: "",
    currencyId: "",
    rate: "",
    rateType: "hourly",
    startDate: "",
    endDate: "",
    invoiceDueDays: "30",
  });

  // Participants state
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState({
    userId: "",
    role: "contractor",
    requiresSignature: false,
    isPrimary: false,
  });

  // Queries
  const { data: companies } = api.company.list.useQuery(undefined, { enabled: open });
  const { data: countries } = api.country.list.useQuery(undefined, { enabled: open });
  const { data: currencies } = api.currency.list.useQuery(undefined, { enabled: open });
  const { data: users } = api.user.listForSelect.useQuery(undefined, { enabled: open });

  const createMutation = api.contract.create.useMutation();

  // Validation
  const isValid =
    form.title.trim() &&
    form.companyId &&
    participants.length > 0;

  // Handlers
  const handleAddParticipant = () => {
    if (!newParticipant.userId) {
      toast.error("Veuillez sélectionner un utilisateur");
      return;
    }

    // 🔥 VALIDATION : Si c'est un approver, requiresSignature DOIT être false
    if (newParticipant.role === "approver" && newParticipant.requiresSignature) {
      toast.error("Les approvers ne peuvent pas avoir requiresSignature. Ils approuvent mais ne signent pas.");
      return;
    }

    // Check if user already has this role
    const exists = participants.find(
      (p) => p.userId === newParticipant.userId && p.role === newParticipant.role
    );
    if (exists) {
      toast.error("Ce participant a déjà ce rôle");
      return;
    }

    setParticipants([
      ...participants,
      {
        ...newParticipant,
        id: Math.random().toString(),
      },
    ]);

    // Reset form
    setNewParticipant({
      userId: "",
      role: "contractor",
      requiresSignature: false,
      isPrimary: false,
    });
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        type: "sow", // contrat normal (pas MSA)
        title: form.title,
        description: form.description,
        companyId: form.companyId,
        contractCountryId: form.contractCountryId || undefined,
        currencyId: form.currencyId || undefined,
        rate: form.rate ? Number(form.rate) : undefined,
        rateType: form.rateType as any,
        startDate: form.startDate ? new Date(form.startDate) : undefined,
        endDate: form.endDate ? new Date(form.endDate) : undefined,
        invoiceDueDays: Number(form.invoiceDueDays),
        status: "draft",
        workflowStatus: "draft",
        participants: participants.map((p) => ({
          userId: p.userId,
          role: p.role,
          // 🔥 IMPORTANT : Approvers ne peuvent JAMAIS avoir requiresSignature
          requiresSignature: p.role === "approver" ? false : p.requiresSignature,
          isPrimary: p.isPrimary,
        })),
      });

      toast.success("Contrat créé avec succès !");
      onOpenChange(false);
      onSuccess?.(result);

      // Reset form
      setForm({
        title: "",
        description: "",
        companyId: "",
        contractCountryId: "",
        currencyId: "",
        rate: "",
        rateType: "hourly",
        startDate: "",
        endDate: "",
        invoiceDueDays: "30",
      });
      setParticipants([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Échec de la création");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Créer un contrat
          </DialogTitle>
          <DialogDescription>
            Créez un contrat avec des participants, approvers et signataires
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Contrat freelance Q1 2024"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du contrat..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Entreprise *</Label>
                  <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Select value={form.contractCountryId} onValueChange={(v) => setForm({ ...form, contractCountryId: v })}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rate">Taux</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="rateType">Type de taux</Label>
                  <Select value={form.rateType} onValueChange={(v) => setForm({ ...form, rateType: v })}>
                    <SelectTrigger id="rateType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Horaire</SelectItem>
                      <SelectItem value="daily">Journalier</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="fixed">Fixe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={form.currencyId} onValueChange={(v) => setForm({ ...form, currencyId: v })}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="invoiceDueDays">Jours de paiement</Label>
                  <Input
                    id="invoiceDueDays"
                    type="number"
                    value={form.invoiceDueDays}
                    onChange={(e) => setForm({ ...form, invoiceDueDays: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-purple-600" />
                Participants *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add participant form */}
              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <Label className="text-sm font-medium">Ajouter un participant</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newUser" className="text-xs">Utilisateur</Label>
                    <Select
                      value={newParticipant.userId}
                      onValueChange={(v) => setNewParticipant({ ...newParticipant, userId: v })}
                    >
                      <SelectTrigger id="newUser">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="newRole" className="text-xs">Rôle</Label>
                    <Select
                      value={newParticipant.role}
                      onValueChange={(v) => {
                        // 🔥 Si le rôle est "approver", on force requiresSignature à false
                        setNewParticipant({
                          ...newParticipant,
                          role: v,
                          requiresSignature: v === "approver" ? false : newParticipant.requiresSignature,
                        });
                      }}
                    >
                      <SelectTrigger id="newRole">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="client_admin">Client Admin</SelectItem>
                        <SelectItem value="approver">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Approver (approbation uniquement)
                          </div>
                        </SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                        <SelectItem value="payroll_partner">Payroll Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="requiresSignature"
                      checked={newParticipant.requiresSignature}
                      onCheckedChange={(checked) =>
                        setNewParticipant({ ...newParticipant, requiresSignature: checked as boolean })
                      }
                      disabled={newParticipant.role === "approver"} // 🔥 Désactivé pour les approvers
                    />
                    <Label htmlFor="requiresSignature" className="text-xs font-normal cursor-pointer">
                      Signature requise
                      {newParticipant.role === "approver" && (
                        <span className="ml-2 text-xs text-yellow-600">(Non disponible pour les approvers)</span>
                      )}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isPrimary"
                      checked={newParticipant.isPrimary}
                      onCheckedChange={(checked) =>
                        setNewParticipant({ ...newParticipant, isPrimary: checked as boolean })
                      }
                    />
                    <Label htmlFor="isPrimary" className="text-xs font-normal cursor-pointer">
                      Participant principal
                    </Label>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddParticipant}
                    className="ml-auto"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>

                {newParticipant.role === "approver" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
                    ℹ️ Les approvers <strong>approuvent</strong> les contrats mais ne les <strong>signent pas</strong>. 
                    Ils vérifient les normes et valident, mais ne font pas partie du contrat en tant que signataires.
                  </div>
                )}
              </div>

              {/* Participants list */}
              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun participant ajouté. Ajoutez au moins un participant.
                  </p>
                ) : (
                  participants.map((p) => {
                    const user = users?.find((u: any) => u.id === p.userId);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-sm">{user?.name || user?.email || p.userId}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {p.role}
                              </Badge>
                              {p.isPrimary && (
                                <Badge className="text-xs bg-blue-50 text-blue-700">
                                  Principal
                                </Badge>
                              )}
                              {/* 🔥 Badge d'approbation pour les approvers */}
                              {p.role === "approver" && (
                                <Badge className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approuvera
                                </Badge>
                              )}
                              {/* 🔥 Badge de signature pour les signataires */}
                              {p.requiresSignature && p.role !== "approver" && (
                                <Badge className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                                  ✍️ Signera
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParticipant(p.id)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              "Créer le contrat"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
