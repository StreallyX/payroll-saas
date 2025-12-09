"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  FileText,
  Info,
  Calendar,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

import { PDFUploadZone } from "../shared/PDFUploadZone";
import { CompanySelect } from "../shared/CompanySelect";
import { UserSelect } from "../shared/UserSelect";
import { UserBankSelect } from "../shared/UserBankSelect";
import { CountrySelect } from "../shared/CountrySelect";
import { CycleSelect } from "../shared/CycleSelect";
import { CurrencySelect } from "../shared/CurrencySelect";
import {
  ParticipantPreSelector,
  type ParticipantPreSelection,
} from "../shared/ParticipantPreSelector";
import { useNormContract } from "@/hooks/contracts/useNormContract";
import { api } from "@/lib/trpc";

interface CreateNormContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contractId: string) => void;
}

type SalaryType = "gross" | "payroll" | "payroll_we_pay" | "split";

export function CreateNormContractModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateNormContractModalProps) {
  const router = useRouter();
  const { createNormContract, isCreating } = useNormContract();
  const { data: currencies } = api.currency.getAll.useQuery();

  // Form State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [additionalParticipants, setAdditionalParticipants] = useState<
    ParticipantPreSelection[]
  >([]);

  const [formData, setFormData] = useState({
    companyTenantId: "",
    agencyId: "",
    contractorId: "",
    startDate: "",
    endDate: "",
    salaryType: "" as SalaryType,

    userBankId: "",
    payrollUserId: "",
    userBankIds: [] as string[],

    // ✓ Rate
    rateAmount: "",
    rateCurrencyId: "",
    rateCycle: "",

    // ✓ Margin
    marginAmount: "",
    marginCurrencyId: "",
    marginType: "" as "fixed" | "percentage" | "",
    marginPaidBy: "" as "client_agency" | "contractor" | "",

    // ✓ New: Invoice terms
    invoiceDueTerm: "",

    // Old fallback
    invoiceDueDays: "",

    notes: "",
    contractReference: "",
    contractVatRate: "",
    contractCountryId: "",
    clientAgencySignDate: "",
  });

  const updateField = (field: string, value: any) =>
    setFormData((p) => ({ ...p, [field]: value }));

  // Currency lookup
  const getCurrencyCode = (currencyId: string): string | undefined => {
    if (!currencyId || !currencies) return undefined;
    return currencies.find((c: any) => c.id === currencyId)?.code;
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!pdfFile) errors.push("Missing: Contract PDF file");
    if (!formData.companyTenantId) errors.push("Missing: Company Tenant");
    if (!formData.agencyId) errors.push("Missing: Agency");
    if (!formData.contractorId) errors.push("Missing: Contractor");

    if (!formData.startDate) errors.push("Missing: Start Date");
    if (!formData.endDate) errors.push("Missing: End Date");

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errors.push("Invalid dates: Start Date must be before End Date");
      }
    }

    if (!formData.salaryType) errors.push("Missing: Salary Type");

    // SalaryType conditional validation
    // GROSS → account optional → donc rien ici


    if (
      (formData.salaryType === "payroll" ||
        formData.salaryType === "payroll_we_pay") &&
      !formData.payrollUserId
    ) {
      errors.push("Missing: Payroll user (Payroll type)");
    }

    if (formData.salaryType === "split" && formData.userBankIds.length === 0) {
      errors.push("Missing: Bank accounts (Split type)");
    }

    // If errors → display them all
    if (errors.length > 0) {
      toast.error(
        `Please fix the following:\n• ${errors.join("\n• ")}`,
        { duration: 6000 }
      );
      return false;
    }

    return true;
  };


  // SUBMIT
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const buffer = await pdfFile!.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const payload: any = {
        pdfBuffer: base64,
        fileName: pdfFile!.name,
        mimeType: pdfFile!.type,
        fileSize: pdfFile!.size,

        companyTenantId: formData.companyTenantId,
        agencyId: formData.agencyId,
        contractorId: formData.contractorId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        salaryType: formData.salaryType,
      };

      // SalaryType logic
      if (formData.salaryType === "gross" && formData.userBankId) {
        payload.userBankId = formData.userBankId;
      }
      if (
        (formData.salaryType === "payroll" ||
          formData.salaryType === "payroll_we_pay") &&
        formData.payrollUserId
      ) {
        payload.payrollUserId = formData.payrollUserId;
      }
      if (formData.salaryType === "split" && formData.userBankIds.length > 0) {
        payload.userBankIds = formData.userBankIds;
      }

      // Rate
      if (formData.rateAmount) payload.rateAmount = parseFloat(formData.rateAmount);
      const rateCurrencyCode = getCurrencyCode(formData.rateCurrencyId);
      if (rateCurrencyCode) payload.rateCurrency = rateCurrencyCode;
      if (formData.rateCycle) payload.rateCycle = formData.rateCycle;

      // Margin
      if (formData.marginAmount)
        payload.marginAmount = parseFloat(formData.marginAmount);
      const marginCurrencyCode = getCurrencyCode(formData.marginCurrencyId);
      if (marginCurrencyCode) payload.marginCurrency = marginCurrencyCode;
      if (formData.marginType) payload.marginType = formData.marginType;
      if (formData.marginPaidBy) payload.marginPaidBy = formData.marginPaidBy;

      // Invoice Due Term (NEW)
      if (formData.invoiceDueTerm) payload.invoiceDueTerm = formData.invoiceDueTerm;

      // Legacy fallback
      if (formData.invoiceDueDays)
        payload.invoiceDueDays = parseInt(formData.invoiceDueDays);

      // Other info
      if (formData.notes) payload.notes = formData.notes;
      if (formData.contractReference)
        payload.contractReference = formData.contractReference;
      if (formData.contractVatRate)
        payload.contractVatRate = parseFloat(formData.contractVatRate);
      if (formData.contractCountryId)
        payload.contractCountryId = formData.contractCountryId;
      if (formData.clientAgencySignDate)
        payload.clientAgencySignDate = new Date(
          formData.clientAgencySignDate
        );

      // Extra participants
      if (additionalParticipants.length > 0) {
        payload.additionalParticipants = additionalParticipants.map((p) => ({
          userId: p.userId,
          companyId: p.companyId,
          role: p.role,
        }));
      }

      const result = await createNormContract.mutateAsync(payload);

      if (result?.contract?.id) {
        onSuccess?.(result.contract.id);
        handleClose();
        router.push(`/contracts/simple/${result.contract.id}`);
      }
    } catch (err) {
      console.error("CreateNormContractModal error:", err);
      toast.error("Failed to create contract.");
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setPdfFile(null);
    setAdditionalParticipants([]);

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
      rateCurrencyId: "",
      rateCycle: "",
      marginAmount: "",
      marginCurrencyId: "",
      marginType: "",
      marginPaidBy: "",
      invoiceDueTerm: "",
      invoiceDueDays: "",
      notes: "",
      contractReference: "",
      contractVatRate: "",
      contractCountryId: "",
      clientAgencySignDate: "",
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create NORM Contract
          </DialogTitle>
          <DialogDescription>
            Create a new normal contract with all required information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Fields with an asterisk (*) are required.
            </AlertDescription>
          </Alert>

          {/* PARTIES */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contract Parties *</h3>
            <CompanySelect
              value={formData.companyTenantId}
              onChange={(v) => updateField("companyTenantId", v)}
              label="Company Tenant"
              required
              roleFilter="tenant"
            />
            <UserSelect
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

          {/* DOCUMENT */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contract Document *</h3>
            <PDFUploadZone
              file={pdfFile}
              onChange={setPdfFile}
              disabled={isCreating}
            />
          </div>

          <Separator />

          {/* DATES */}
          <div className="space-y-4">
            <h3 className="font-semibold">Dates *</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="required">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Date *
                </Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="required">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  End Date *
                </Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SALARY TYPE */}
          <div className="space-y-4">
            <h3 className="font-semibold">Salary Type & Payment *</h3>

            <div className="space-y-2">
              <Label className="required">Salary Type *</Label>
              <Select
                value={formData.salaryType}
                onValueChange={(v) => updateField("salaryType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salary type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross">Gross</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="payroll_we_pay">Payroll We Pay</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CONDITIONAL FIELDS */}
            {formData.salaryType === "gross" && (
              <UserBankSelect
                userId={formData.contractorId}
                value={formData.userBankId}
                onChange={(v) => updateField("userBankId", v)}
                label="Payment Method (optional)"
              />
            )}

            {(formData.salaryType === "payroll" ||
              formData.salaryType === "payroll_we_pay") && (
              <>
                <UserSelect
                  value={formData.payrollUserId}
                  onChange={(v) => updateField("payrollUserId", v)}
                  label="Payroll User"
                  required
                  roleFilter="payroll"
                />
                {formData.salaryType === "payroll_we_pay" && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Payroll We Pay mode: managed by system.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {formData.salaryType === "split" && (
              <UserBankSelect
                userId={formData.contractorId}
                values={formData.userBankIds}
                multiple
                onChangeMultiple={(v) => updateField("userBankIds", v)}
                label="Payment Methods (multiple)"
              />
            )}
          </div>

          <Separator />

          {/* RATE */}
          <div className="space-y-4">
            <h3 className="font-semibold">Rate (optional)</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Rate Amount
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rateAmount}
                  onChange={(e) => updateField("rateAmount", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <CurrencySelect
                value={formData.rateCurrencyId}
                onChange={(v) => updateField("rateCurrencyId", v)}
                label="Currency"
              />

              <CycleSelect
                value={formData.rateCycle}
                onChange={(v) => updateField("rateCycle", v)}
                label="Cycle"
              />
            </div>
          </div>

          {/* MARGIN */}
          <div className="space-y-4">
            <h3 className="font-semibold">Margin (optional)</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Margin Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.marginAmount}
                  onChange={(e) => updateField("marginAmount", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <CurrencySelect
                value={formData.marginCurrencyId}
                onChange={(v) => updateField("marginCurrencyId", v)}
                label="Currency"
              />

              <div className="space-y-2">
                <Label>Margin Type</Label>
                <Select
                  value={formData.marginType}
                  onValueChange={(v) => updateField("marginType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* NEW: marginPaidBy */}
            <div className="space-y-2">
              <Label>Margin Paid By</Label>
              <Select
                value={formData.marginPaidBy}
                onValueChange={(v) => updateField("marginPaidBy", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client / Agency</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* OTHER INFO */}
          <div className="space-y-4">
            <h3 className="font-semibold">Other Information (optional)</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* NEW: Invoice Due Term */}
              <div className="space-y-2">
                <Label>Invoice Due Date</Label>
                <Select
                  value={formData.invoiceDueTerm}
                  onValueChange={(v) => updateField("invoiceDueTerm", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upon_receipt">Upon receipt</SelectItem>
                    <SelectItem value="7_days">7 Days</SelectItem>
                    <SelectItem value="15_days">15 Days</SelectItem>
                    <SelectItem value="30_days">30 Days</SelectItem>
                    <SelectItem value="45_days">45 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>VAT Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.contractVatRate}
                  onChange={(e) => updateField("contractVatRate", e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>

            <CountrySelect
              value={formData.contractCountryId}
              onChange={(v) => updateField("contractCountryId", v)}
              label="Contract Country"
            />

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Extra participants */}
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Additional Participants</h3>
            <ParticipantPreSelector
              participants={additionalParticipants}
              onChange={setAdditionalParticipants}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Contract"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
