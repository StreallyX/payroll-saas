"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Info, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { PDFUploadZone } from "../shared/PDFUploadZone";
import { CompanySelect } from "../shared/CompanySelect";
import { UserSelect } from "../shared/UserSelect";
import { UserBankSelect } from "../shared/UserBankSelect";
import { CountrySelect } from "../shared/CountrySelect";
import { CycleSelect } from "../shared/CycleSelect";
import { useNormContract } from "@/hooks/contracts/useNormContract";

interface CreateNormContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contractId: string) => void;
}

type SalaryType = "gross" | "payroll" | "payroll_we_pay" | "split";

/**
 * Modal de création de contrat NORM (Normal Contract)
 * 
 * Logique conditionnelle selon salaryType:
 * - Gross: une UserBank (userBankId)
 * - Payroll: un payroll user (payrollUserId)
 * - Payroll We Pay: un payroll user (géré par le système)
 * - Split: plusieurs UserBanks (userBankIds[])
 */
export function CreateNormContractModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateNormContractModalProps) {
  const router = useRouter();
  const { createNormContract, isCreating } = useNormContract();

  // État du formulaire
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    // Champs essentiels
    companyTenantId: "",
    agencyId: "",
    contractorId: "",
    startDate: "",
    endDate: "",
    salaryType: "" as SalaryType,
    
    // Champs conditionnels
    userBankId: "",
    payrollUserId: "",
    userBankIds: [] as string[],
    
    // Champs optionnels - Tarification
    rateAmount: "",
    rateCurrency: "EUR",
    rateCycle: "",
    
    // Champs optionnels - Marge
    marginAmount: "",
    marginCurrency: "EUR",
    marginType: "" as "fixed" | "percentage" | "",
    marginPaidBy: "" as "client" | "agency" | "",
    
    // Champs optionnels - Autres
    invoiceDueDays: "",
    notes: "",
    contractReference: "",
    contractVatRate: "",
    contractCountryId: "",
    clientAgencySignDate: "",
  });

  /**
   * Met à jour un champ du formulaire
   */
  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Valide le formulaire
   */
  const validateForm = (): boolean => {
    if (!pdfFile) {
      toast.error("Veuillez sélectionner un fichier PDF");
      return false;
    }

    // Champs essentiels
    if (!formData.companyTenantId || !formData.agencyId || !formData.contractorId) {
      toast.error("Veuillez remplir tous les champs obligatoires (parties)");
      return false;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Veuillez remplir les dates de début et de fin");
      return false;
    }

    if (!formData.salaryType) {
      toast.error("Veuillez sélectionner un type de salaire");
      return false;
    }

    // Validation conditionnelle selon salaryType
    if (formData.salaryType === "gross" && !formData.userBankId) {
      toast.error("Veuillez sélectionner une méthode de paiement pour le type Gross");
      return false;
    }

    if ((formData.salaryType === "payroll" || formData.salaryType === "payroll_we_pay") && !formData.payrollUserId) {
      toast.error("Veuillez sélectionner un utilisateur Payroll");
      return false;
    }

    if (formData.salaryType === "split" && formData.userBankIds.length === 0) {
      toast.error("Veuillez sélectionner au moins une méthode de paiement pour le type Split");
      return false;
    }

    // Validation des dates
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("La date de début doit être antérieure à la date de fin");
      return false;
    }

    return true;
  };

  /**
   * Soumet le formulaire
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Convertir le fichier en base64
      const buffer = await pdfFile!.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Préparer les données
      const payload: any = {
        pdfBuffer: base64,
        fileName: pdfFile!.name,
        mimeType: pdfFile!.type,
        fileSize: pdfFile!.size,
        
        // Champs essentiels
        companyTenantId: formData.companyTenantId,
        agencyId: formData.agencyId,
        contractorId: formData.contractorId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        salaryType: formData.salaryType,
      };

      // Champs conditionnels
      if (formData.salaryType === "gross" && formData.userBankId) {
        payload.userBankId = formData.userBankId;
      }
      if ((formData.salaryType === "payroll" || formData.salaryType === "payroll_we_pay") && formData.payrollUserId) {
        payload.payrollUserId = formData.payrollUserId;
      }
      if (formData.salaryType === "split" && formData.userBankIds.length > 0) {
        payload.userBankIds = formData.userBankIds;
      }

      // Champs optionnels - Tarification
      if (formData.rateAmount) payload.rateAmount = parseFloat(formData.rateAmount);
      if (formData.rateCurrency) payload.rateCurrency = formData.rateCurrency;
      if (formData.rateCycle) payload.rateCycle = formData.rateCycle;

      // Champs optionnels - Marge
      if (formData.marginAmount) payload.marginAmount = parseFloat(formData.marginAmount);
      if (formData.marginCurrency) payload.marginCurrency = formData.marginCurrency;
      if (formData.marginType) payload.marginType = formData.marginType;
      if (formData.marginPaidBy) payload.marginPaidBy = formData.marginPaidBy;

      // Champs optionnels - Autres
      if (formData.invoiceDueDays) payload.invoiceDueDays = parseInt(formData.invoiceDueDays);
      if (formData.notes) payload.notes = formData.notes;
      if (formData.contractReference) payload.contractReference = formData.contractReference;
      if (formData.contractVatRate) payload.contractVatRate = parseFloat(formData.contractVatRate);
      if (formData.contractCountryId) payload.contractCountryId = formData.contractCountryId;
      if (formData.clientAgencySignDate) payload.clientAgencySignDate = new Date(formData.clientAgencySignDate);

      const result = await createNormContract.mutateAsync(payload);
      if (result?.contract?.id) {
        onSuccess?.(result.contract.id);
        handleClose();
        router.push(`/contracts/simple/${result.contract.id}`);
      }
    } catch (error) {
      console.error("[CreateNormContractModal] Error:", error);
    }
  };

  /**
   * Ferme le modal
   */
  const handleClose = () => {
    if (!isCreating) {
      setPdfFile(null);
      setFormData({
        companyTenantId: "",
        agencyId: "",
        contractorId: "",
        startDate: "",
        endDate: "",
        salaryType: "" as SalaryType,
        userBankId: "",
        payrollUserId: "",
        userBankIds: [],
        rateAmount: "",
        rateCurrency: "EUR",
        rateCycle: "",
        marginAmount: "",
        marginCurrency: "EUR",
        marginType: "",
        marginPaidBy: "",
        invoiceDueDays: "",
        notes: "",
        contractReference: "",
        contractVatRate: "",
        contractCountryId: "",
        clientAgencySignDate: "",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Créer un contrat NORM (Normal Contract)
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau contrat normal avec toutes les informations nécessaires
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Alert d'information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Les champs avec un astérisque (*) sont obligatoires
            </AlertDescription>
          </Alert>

          {/* Section: Parties */}
          <div className="space-y-4">
            <h3 className="font-semibold">Parties du contrat *</h3>
            <CompanySelect
              value={formData.companyTenantId}
              onChange={(v) => updateField("companyTenantId", v)}
              label="Company Tenant"
              required
              roleFilter="tenant"
            />
            <CompanySelect
              value={formData.agencyId}
              onChange={(v) => updateField("agencyId", v)}
              label="Agency"
              required
              roleFilter="agency"
            />
            <UserSelect
              value={formData.contractorId}
              onChange={(v) => updateField("contractorId", v)}
              label="Contractor"
              required
              roleFilter="contractor"
            />
          </div>

          <Separator />

          {/* Section: Document */}
          <div className="space-y-4">
            <h3 className="font-semibold">Document *</h3>
            <PDFUploadZone file={pdfFile} onChange={setPdfFile} disabled={isCreating} />
          </div>

          <Separator />

          {/* Section: Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold">Dates *</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="required">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date de début *
                </Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label className="required">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date de fin *
                </Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Type de salaire et paiement */}
          <div className="space-y-4">
            <h3 className="font-semibold">Type de salaire et paiement *</h3>
            <div className="space-y-2">
              <Label className="required">Type de salaire *</Label>
              <Select
                value={formData.salaryType}
                onValueChange={(v) => updateField("salaryType", v)}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross">Gross</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="payroll_we_pay">Payroll We Pay</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champs conditionnels selon salaryType */}
            {formData.salaryType === "gross" && (
              <UserBankSelect
                userId={formData.contractorId}
                value={formData.userBankId}
                onChange={(v) => updateField("userBankId", v)}
                label="Méthode de paiement"
                required
              />
            )}

            {(formData.salaryType === "payroll" || formData.salaryType === "payroll_we_pay") && (
              <>
                <UserSelect
                  value={formData.payrollUserId}
                  onChange={(v) => updateField("payrollUserId", v)}
                  label="Utilisateur Payroll"
                  required
                  roleFilter="payroll"
                />
                {formData.salaryType === "payroll_we_pay" && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Mode &quot;Payroll We Pay&quot; : géré par le système
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {formData.salaryType === "split" && (
              <UserBankSelect
                userId={formData.contractorId}
                values={formData.userBankIds}
                onChangeMultiple={(v) => updateField("userBankIds", v)}
                label="Méthodes de paiement (multiple)"
                required
                multiple
              />
            )}
          </div>

          <Separator />

          {/* Section: Tarification (optionnelle) */}
          <div className="space-y-4">
            <h3 className="font-semibold">Tarification (optionnel)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Montant
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rateAmount}
                  onChange={(e) => updateField("rateAmount", e.target.value)}
                  disabled={isCreating}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Input
                  value={formData.rateCurrency}
                  onChange={(e) => updateField("rateCurrency", e.target.value)}
                  disabled={isCreating}
                  maxLength={3}
                />
              </div>
              <CycleSelect
                value={formData.rateCycle}
                onChange={(v) => updateField("rateCycle", v)}
                label="Cycle"
              />
            </div>
          </div>

          {/* Section: Marge (optionnelle) */}
          <div className="space-y-4">
            <h3 className="font-semibold">Marge (optionnel)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant de la marge</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.marginAmount}
                  onChange={(e) => updateField("marginAmount", e.target.value)}
                  disabled={isCreating}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Type de marge</Label>
                <Select
                  value={formData.marginType}
                  onValueChange={(v) => updateField("marginType", v)}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixe</SelectItem>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Autres informations (optionnelles) */}
          <div className="space-y-4">
            <h3 className="font-semibold">Autres informations (optionnel)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jours avant échéance facture</Label>
                <Input
                  type="number"
                  value={formData.invoiceDueDays}
                  onChange={(e) => updateField("invoiceDueDays", e.target.value)}
                  disabled={isCreating}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>Taux de TVA (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.contractVatRate}
                  onChange={(e) => updateField("contractVatRate", e.target.value)}
                  disabled={isCreating}
                  placeholder="20"
                />
              </div>
            </div>
            <CountrySelect
              value={formData.contractCountryId}
              onChange={(v) => updateField("contractCountryId", v)}
              label="Pays du contrat"
            />
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                disabled={isCreating}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer le contrat NORM"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
