"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";
import { Loader2, Landmark, Plus, Building, Users } from "lucide-react";
import { useSession } from "next-auth/react";

type CompanyFormValues = {
  name: string;
  bankId?: string;

  ownerType: "tenant" | "user";

  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;

  officeBuilding?: string;
  address1?: string;
  address2?: string;
  city?: string;
  countryId?: string;
  state?: string;
  postCode?: string;

  invoicingContactName?: string;
  invoicingContactPhone?: string;
  invoicingContactEmail?: string;
  alternateInvoicingEmail?: string;
  vatNumber?: string;
  website?: string;

  status: "active" | "inactive";
};

function sanitizeForm(form: CompanyFormValues): CompanyFormValues {
  const cleaned: any = {};

  for (const [key, value] of Object.entries(form)) {
    cleaned[key] = value === "" ? undefined : value;
  }

  return cleaned as CompanyFormValues;
}

type CompanyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: any;
  onSuccess?: () => void;
  /** When true, hides the tenant toggle and forces ownerType to "user" (agency/client only) */
  agencyMode?: boolean;
};

export function CompanyModal({
  open,
  onOpenChange,
  company,
  onSuccess,
  agencyMode = false,
}: CompanyModalProps) {
  const initialState: CompanyFormValues = {
    name: "",
    bankId: undefined,

    ownerType: "user",

    contactPerson: undefined,
    contactEmail: undefined,
    contactPhone: undefined,

    officeBuilding: undefined,
    address1: undefined,
    address2: undefined,
    city: undefined,
    countryId: undefined,
    state: undefined,
    postCode: undefined,

    invoicingContactName: undefined,
    invoicingContactPhone: undefined,
    invoicingContactEmail: undefined,
    alternateInvoicingEmail: undefined,
    vatNumber: undefined,
    website: undefined,

    status: "active",
  };

  const [formData, setFormData] = useState<CompanyFormValues>(initialState);

  const utils = api.useUtils();
  const router = useRouter();

  const { data: countries = [] } = api.country.getAll.useQuery();
  const { data: banks = [] } = api.bank.getAll.useQuery();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions || [];
  const canAssignTenantCompany = permissions.includes("company.create.global");

  const STORAGE_KEY = "company-form-draft";

  const redirectToBankSettings = () => {
    // Save form data before leaving
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    onOpenChange(false);
    // Pass returnTo parameter so banks page can redirect back after creation
    router.push("/settings/banks?returnTo=/settings/companies&openModal=true");
  };

  const createMutation = api.company.create.useMutation({
    onSuccess: () => {
      toast.success("Company created!");
      utils.company.getAll.invalidate();
      sessionStorage.removeItem(STORAGE_KEY); // Clear draft
      onSuccess?.();
      onOpenChange(false);
      setFormData(initialState);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = api.company.update.useMutation({
    onSuccess: () => {
      toast.success("Company updated!");
      utils.company.getAll.invalidate();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (company) {
      // Editing existing company
      setFormData({
        name: company.name ?? "",
        bankId: company.bankId ?? undefined,

        ownerType: company.ownerType ?? "user",

        contactPerson: company.contactPerson ?? undefined,
        contactEmail: company.contactEmail ?? undefined,
        contactPhone: company.contactPhone ?? undefined,

        officeBuilding: company.officeBuilding ?? undefined,
        address1: company.address1 ?? undefined,
        address2: company.address2 ?? undefined,
        city: company.city ?? undefined,
        countryId: company.countryId ?? undefined,
        state: company.state ?? undefined,
        postCode: company.postCode ?? undefined,

        invoicingContactName: company.invoicingContactName ?? undefined,
        invoicingContactPhone: company.invoicingContactPhone ?? undefined,
        invoicingContactEmail: company.invoicingContactEmail ?? undefined,
        alternateInvoicingEmail: company.alternateInvoicingEmail ?? undefined,
        vatNumber: company.vatNumber ?? undefined,
        website: company.website ?? undefined,

        status: (company.status as "active" | "inactive") ?? "active",
      });
    } else if (open) {
      // Creating new company - check for saved draft first
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed);
          sessionStorage.removeItem(STORAGE_KEY);
          return; // Don't reset to initial state
        } catch (e) {
          // Ignore parse errors
        }
      }
      setFormData(initialState);
    }
  }, [company, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitized = sanitizeForm(formData);

    // In agency mode, always force ownerType to "user" (no platform companies)
    if (agencyMode) {
      sanitized.ownerType = "user";
    }
    // Security: only users with permission can set ownerType to "tenant"
    else if (!company && !canAssignTenantCompany) {
      sanitized.ownerType = "user";
    }

    if (company) {
      updateMutation.mutate({
        id: company.id,
        ...sanitized,
      });
    } else {
      createMutation.mutate(sanitized);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Add Company"}</DialogTitle>
          <DialogDescription>
            Only the company name and tenant status are required. All other fields are optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Basic Information</h3>

            <InputBlock
              label="Name *"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
            />

            {!agencyMode && (canAssignTenantCompany || company) && (
              <div className={`p-4 rounded-lg border-2 transition-all ${
                formData.ownerType === "tenant"
                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300"
                  : "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200"
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      formData.ownerType === "tenant"
                        ? "bg-indigo-100"
                        : "bg-slate-100"
                    }`}>
                      {formData.ownerType === "tenant" ? (
                        <Building className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Users className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Label className={`text-base font-semibold ${
                        formData.ownerType === "tenant" ? "text-indigo-900" : "text-slate-900"
                      }`}>
                        {formData.ownerType === "tenant" ? "Platform Entity" : "Client Company"}
                      </Label>
                      <p className={`text-sm mt-1 ${
                        formData.ownerType === "tenant" ? "text-indigo-700" : "text-slate-600"
                      }`}>
                        {formData.ownerType === "tenant"
                          ? "This is one of your own business entities. It will appear as an option when creating contracts, invoices, and other platform operations."
                          : "This is a client company. It can be assigned to users but won't appear in platform entity selections."
                        }
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={formData.ownerType === "tenant"}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, ownerType: checked ? "tenant" : "user" })
                    }
                    className="data-[state=checked]:bg-indigo-600 flex-shrink-0"
                  />
                </div>

                {formData.ownerType === "tenant" && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs text-indigo-600 font-medium">
                      Platform entities are used for: Contract signatories, Invoice issuers, Payroll processing
                    </p>
                  </div>
                )}
              </div>
            )}

            {!agencyMode && !canAssignTenantCompany && company && (
              <div className={`p-4 rounded-lg border ${
                company.ownerType === "tenant"
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-3">
                  {company.ownerType === "tenant" ? (
                    <Building className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Users className="h-5 w-5 text-slate-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {company.ownerType === "tenant" ? "Platform Entity" : "Client Company"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {company.ownerType === "tenant"
                        ? "This company is one of your business entities"
                        : "This is a client company"
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}


            <div className="space-y-2">
              <Label>Bank (Optional)</Label>
              <Select
                value={formData.bankId ?? ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, bankId: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>

                <SelectContent>
                  {banks.length === 0 && (
                    <div className="px-2 py-2">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          redirectToBankSettings();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Bank
                      </Button>
                    </div>
                  )}

                  {banks.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-gray-500" />
                        {b.name}
                      </div>
                    </SelectItem>
                  ))}

                  {banks.length > 0 && (
                    <div className="border-t mt-2 px-2 py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          redirectToBankSettings();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Bank
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Contact Info (Optional)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputBlock
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(v) =>
                  setFormData({ ...formData, contactPerson: v || undefined })
                }
              />
              <InputBlock
                label="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(v) =>
                  setFormData({ ...formData, contactEmail: v || undefined })
                }
              />
              <InputBlock
                label="Contact Phone"
                value={formData.contactPhone}
                onChange={(v) =>
                  setFormData({ ...formData, contactPhone: v || undefined })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Address (Optional)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputBlock
                label="Office / Building"
                value={formData.officeBuilding}
                onChange={(v) =>
                  setFormData({ ...formData, officeBuilding: v || undefined })
                }
              />

              <InputBlock
                label="Address 1"
                value={formData.address1}
                onChange={(v) =>
                  setFormData({ ...formData, address1: v || undefined })
                }
              />

              <InputBlock
                label="Address 2"
                value={formData.address2}
                onChange={(v) =>
                  setFormData({ ...formData, address2: v || undefined })
                }
              />

              <InputBlock
                label="City"
                value={formData.city}
                onChange={(v) =>
                  setFormData({ ...formData, city: v || undefined })
                }
              />

              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={formData.countryId ?? ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      countryId: value || undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <InputBlock
                label="State"
                value={formData.state}
                onChange={(v) =>
                  setFormData({ ...formData, state: v || undefined })
                }
              />

              <InputBlock
                label="Post Code"
                value={formData.postCode}
                onChange={(v) =>
                  setFormData({ ...formData, postCode: v || undefined })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Invoicing (Optional)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputBlock
                label="Invoicing Contact Name"
                value={formData.invoicingContactName}
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    invoicingContactName: v || undefined,
                  })
                }
              />

              <InputBlock
                label="Invoicing Contact Phone"
                value={formData.invoicingContactPhone}
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    invoicingContactPhone: v || undefined,
                  })
                }
              />

              <InputBlock
                label="Invoicing Email"
                type="email"
                value={formData.invoicingContactEmail}
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    invoicingContactEmail: v || undefined,
                  })
                }
              />

              <InputBlock
                label="Alternate Email"
                type="email"
                value={formData.alternateInvoicingEmail}
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    alternateInvoicingEmail: v || undefined,
                  })
                }
              />

              {/* Dynamic Tax ID field based on country */}
              {(() => {
                const selectedCountry = countries.find((c: any) => c.id === formData.countryId);
                const isUS = selectedCountry?.code === "US";
                const taxLabel = isUS ? "EIN (Employer ID Number)" : "VAT Number";
                const taxPlaceholder = isUS ? "XX-XXXXXXX" : "VAT Number";

                return (
                  <div className="space-y-2">
                    <Label>{taxLabel}</Label>
                    <Input
                      value={formData.vatNumber ?? ""}
                      onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value || undefined })}
                      placeholder={taxPlaceholder}
                    />
                    {isUS && (
                      <p className="text-xs text-muted-foreground">
                        For US entities, enter your federal EIN
                      </p>
                    )}
                  </div>
                );
              })()}

              <InputBlock
                label="Website"
                type="text"
                value={formData.website}
                onChange={(v) =>
                  setFormData({ ...formData, website: v || undefined })
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {company ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InputBlock({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </div>
  );
}
