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
import { Loader2, Landmark, Plus } from "lucide-react";

// ===========================================================
// TYPES — IMPORTANT : UNIQUEMENT string | undefined
// (compatibilité totale avec Zod + Prisma)
// ===========================================================
type CompanyFormValues = {
  name: string;
  bankId?: string;
  
  // 🔥 NEW — Tenant company flag
  tenantCompany: boolean;

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

// ===========================================================
// SANITIZER — convertit "" en undefined
// ===========================================================
function sanitizeForm(form: CompanyFormValues): CompanyFormValues {
  const cleaned: any = {};

  for (const [key, value] of Object.entries(form)) {
    cleaned[key] = value === "" ? undefined : value;
  }

  return cleaned as CompanyFormValues;
}

// ===========================================================
// PROPS
// ===========================================================
type CompanyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: any;
  onSuccess?: () => void;
};

// ===========================================================
// COMPONENT
// ===========================================================
export function CompanyModal({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyModalProps) {
  // --------------------------------------------------------
  // INITIAL STATE
  // --------------------------------------------------------
  const initialState: CompanyFormValues = {
    name: "",
    bankId: undefined,
    
    // 🔥 NEW — Tenant company flag
    tenantCompany: false,

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

  // --------------------------------------------------------
  // REDIRECT TO BANKS
  // --------------------------------------------------------
  const redirectToBankSettings = () => {
    onOpenChange(false);
    router.push("/settings/banks");
  };

  // --------------------------------------------------------
  // MUTATIONS
  // --------------------------------------------------------
  const createMutation = api.company.create.useMutation({
    onSuccess: () => {
      toast.success("Company created!");
      utils.company.getAll.invalidate();
      onSuccess?.();
      onOpenChange(false);
      setFormData(initialState);
    },
    onError: (err) => toast.error(err.message || "Failed to create company"),
  });

  const updateMutation = api.company.update.useMutation({
    onSuccess: () => {
      toast.success("Company updated!");
      utils.company.getAll.invalidate();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || "Failed to update company"),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // --------------------------------------------------------
  // PREFILL WHEN EDITING
  // --------------------------------------------------------
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name ?? "",
        bankId: company.bankId ?? undefined,
        
        // 🔥 NEW — Tenant company flag
        tenantCompany: company.tenantCompany ?? false,

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
    } else {
      setFormData(initialState);
    }
  }, [company, open]);

  // --------------------------------------------------------
  // SUBMIT
  // --------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitized = sanitizeForm(formData);

    if (company) {
      updateMutation.mutate({ id: company.id, ...sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Add Company"}</DialogTitle>
          <DialogDescription>Fill the company details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC INFORMATION */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Basic Information</h3>

            <InputBlock
              label="Name *"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
            />

            {/* 🔥 NEW — TENANT COMPANY TOGGLE */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold text-blue-900">
                  Tenant Company
                </Label>
                <p className="text-sm text-blue-700 mt-1">
                  Cette company appartient-elle à la plateforme (tenant) ?
                </p>
              </div>
              <Switch
                checked={formData.tenantCompany}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, tenantCompany: checked })
                }
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* BANK SELECT */}
            <div className="space-y-2">
              <Label>Bank</Label>
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

          {/* CONTACT INFO */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Contact Info</h3>

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

          {/* ADDRESS */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Address</h3>

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

              {/* COUNTRY */}
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

          {/* INVOICE INFO */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Invoicing</h3>

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

              <InputBlock
                label="VAT Number"
                value={formData.vatNumber}
                onChange={(v) =>
                  setFormData({ ...formData, vatNumber: v || undefined })
                }
              />

              <InputBlock
                label="Website"
                type="url"
                value={formData.website}
                onChange={(v) =>
                  setFormData({ ...formData, website: v || undefined })
                }
              />
            </div>
          </div>

          {/* FOOTER */}
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

// ===========================================================
// SMALL INPUT COMPONENT
// ===========================================================
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
