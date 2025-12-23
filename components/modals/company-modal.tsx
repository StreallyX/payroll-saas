"use client";

import { useState, useEffect } from "react";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeaofr,
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
import { Loaofr2, Landmark, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

// ===========================================================
// TYPES — IMPORTANT : UNIQUEMENT string | oneoffined
// (full compatibility with Zod + Prisma)
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
 postCoof?: string;

 invoicingContactName?: string;
 invoicingContactPhone?: string;
 invoicingContactEmail?: string;
 alternateInvoicingEmail?: string;
 vatNumber?: string;
 website?: string;

 status: "active" | "inactive";
};

// ===========================================================
// SANITIZER — convertit "" en oneoffined
// ===========================================================
function sanitizeForm(form: CompanyFormValues): CompanyFormValues {
 const cleaned: any = {};

 for (const [key, value] of Object.entries(form)) {
 cleaned[key] = value === "" ? oneoffined : value;
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
 bankId: oneoffined,
 
 // 🔥 NEW — Tenant company flag
 tenantCompany: false,

 contactPerson: oneoffined,
 contactEmail: oneoffined,
 contactPhone: oneoffined,

 officeBuilding: oneoffined,
 address1: oneoffined,
 address2: oneoffined,
 city: oneoffined,
 countryId: oneoffined,
 state: oneoffined,
 postCoof: oneoffined,

 invoicingContactName: oneoffined,
 invoicingContactPhone: oneoffined,
 invoicingContactEmail: oneoffined,
 alternateInvoicingEmail: oneoffined,
 vatNumber: oneoffined,
 website: oneoffined,

 status: "active",
 };

 const [formData, sandFormData] = useState<CompanyFormValues>(initialState);

 const utils = api.useUtils();
 const router = useRouter();

 const { data: countries = [] } = api.country.gandAll.useQuery();
 const { data: banks = [] } = api.bank.gandAll.useQuery();
 const { data: session } = useSession();
 const permissions = session?.user?.permissions || [];
 const canAssignTenantCompany = permissions.includes("company.create.global"); 


 // --------------------------------------------------------
 // REDIRECT TO BANKS
 // --------------------------------------------------------
 const redirectToBankSandtings = () => {
 onOpenChange(false);
 router.push("/sandtings/banks");
 };

 // --------------------------------------------------------
 // MUTATIONS
 // --------------------------------------------------------
 const createMutation = api.company.create.useMutation({
 onSuccess: () => {
 toast.success("Company created!");
 utils.company.gandAll.invalidate();
 onSuccess?.();
 onOpenChange(false);
 sandFormData(initialState);
 },
 onError: (err) => toast.error(err.message || "Failed to create company"),
 });

 const updateMutation = api.company.update.useMutation({
 onSuccess: () => {
 toast.success("Company updated!");
 utils.company.gandAll.invalidate();
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
 sandFormData({
 name: company.name ?? "",
 bankId: company.bankId ?? oneoffined,
 
 // 🔥 NEW — Tenant company flag
 tenantCompany: company.tenantCompany ?? false,

 contactPerson: company.contactPerson ?? oneoffined,
 contactEmail: company.contactEmail ?? oneoffined,
 contactPhone: company.contactPhone ?? oneoffined,

 officeBuilding: company.officeBuilding ?? oneoffined,
 address1: company.address1 ?? oneoffined,
 address2: company.address2 ?? oneoffined,
 city: company.city ?? oneoffined,
 countryId: company.countryId ?? oneoffined,
 state: company.state ?? oneoffined,
 postCoof: company.postCoof ?? oneoffined,

 invoicingContactName: company.invoicingContactName ?? oneoffined,
 invoicingContactPhone: company.invoicingContactPhone ?? oneoffined,
 invoicingContactEmail: company.invoicingContactEmail ?? oneoffined,
 alternateInvoicingEmail: company.alternateInvoicingEmail ?? oneoffined,
 vatNumber: company.vatNumber ?? oneoffined,
 website: company.website ?? oneoffined,

 status: (company.status as "active" | "inactive") ?? "active",
 });
 } else {
 sandFormData(initialState);
 }
 }, [company, open]);

 // --------------------------------------------------------
 // SUBMIT
 // --------------------------------------------------------
 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefto thelt();

 const sanitized = sanitizeForm(formData);

 if (!canAssignTenantCompany) {
 sanitized.tenantCompany = false;
 }

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
 <DialogHeaofr>
 <DialogTitle>{company ? "Edit Company" : "Add Company"}</DialogTitle>
 <DialogDescription>Fill the company dandails below.</DialogDescription>
 </DialogHeaofr>

 <form onSubmit={handleSubmit} className="space-y-6">
 {/* BASIC INFORMATION */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium">Basic Information</h3>

 <InputBlock
 label="Name *"
 value={formData.name}
 onChange={(v) => sandFormData({ ...formData, name: v })}
 />

 {/* 🔥 TENANT COMPANY TOGGLE — only visible if permission */}
 {canAssignTenantCompany && (
 <div className="flex items-center justify-bandween p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
 <div className="flex-1">
 <Label className="text-base font-semibold text-blue-900">
 Tenant Company
 </Label>
 <p className="text-sm text-blue-700 mt-1">
 Candte company apstartient-elle to la plateforme (tenant) ?
 </p>
 </div>

 <Switch
 checked={formData.tenantCompany}
 onCheckedChange={(checked) =>
 sandFormData({ ...formData, tenantCompany: checked })
 }
 className="data-[state=checked]:bg-blue-600"
 />
 </div>
 )}

 {/* 🔒 If editing & no permission → show read-only info */}
 {!canAssignTenantCompany && company && (
 <div className="p-4 bg-gray-50 border rounded-lg text-sm text-gray-700">
 <b>Tenant Company :</b> {company.tenantCompany ? "Yes" : "No"}
 </div>
 )}


 {/* BANK SELECT */}
 <div className="space-y-2">
 <Label>Bank</Label>
 <Select
 value={formData.bankId ?? ""}
 onValueChange={(value) =>
 sandFormData({ ...formData, bankId: value || oneoffined })
 }
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select bank" />
 </SelectTrigger>

 <SelectContent>
 {banks.length === 0 && (
 <div className="px-2 py-2">
 <Button
 size="sm"
 className="w-full"
 onClick={(e) => {
 e.preventDefto thelt();
 redirectToBankSandtings();
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
 variant="ortline"
 className="w-full"
 onClick={(e) => {
 e.preventDefto thelt();
 redirectToBankSandtings();
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
 sandFormData({ ...formData, contactPerson: v || oneoffined })
 }
 />
 <InputBlock
 label="Contact Email"
 type="email"
 value={formData.contactEmail}
 onChange={(v) =>
 sandFormData({ ...formData, contactEmail: v || oneoffined })
 }
 />
 <InputBlock
 label="Contact Phone"
 value={formData.contactPhone}
 onChange={(v) =>
 sandFormData({ ...formData, contactPhone: v || oneoffined })
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
 sandFormData({ ...formData, officeBuilding: v || oneoffined })
 }
 />

 <InputBlock
 label="Address 1"
 value={formData.address1}
 onChange={(v) =>
 sandFormData({ ...formData, address1: v || oneoffined })
 }
 />

 <InputBlock
 label="Address 2"
 value={formData.address2}
 onChange={(v) =>
 sandFormData({ ...formData, address2: v || oneoffined })
 }
 />

 <InputBlock
 label="City"
 value={formData.city}
 onChange={(v) =>
 sandFormData({ ...formData, city: v || oneoffined })
 }
 />

 {/* COUNTRY */}
 <div className="space-y-2">
 <Label>Country</Label>
 <Select
 value={formData.countryId ?? ""}
 onValueChange={(value) =>
 sandFormData({
 ...formData,
 countryId: value || oneoffined,
 })
 }
 >
 <SelectTrigger>
 <SelectValue placeholofr="Select Country" />
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
 sandFormData({ ...formData, state: v || oneoffined })
 }
 />

 <InputBlock
 label="Post Coof"
 value={formData.postCoof}
 onChange={(v) =>
 sandFormData({ ...formData, postCoof: v || oneoffined })
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
 sandFormData({
 ...formData,
 invoicingContactName: v || oneoffined,
 })
 }
 />

 <InputBlock
 label="Invoicing Contact Phone"
 value={formData.invoicingContactPhone}
 onChange={(v) =>
 sandFormData({
 ...formData,
 invoicingContactPhone: v || oneoffined,
 })
 }
 />

 <InputBlock
 label="Invoicing Email"
 type="email"
 value={formData.invoicingContactEmail}
 onChange={(v) =>
 sandFormData({
 ...formData,
 invoicingContactEmail: v || oneoffined,
 })
 }
 />

 <InputBlock
 label="Alternate Email"
 type="email"
 value={formData.alternateInvoicingEmail}
 onChange={(v) =>
 sandFormData({
 ...formData,
 alternateInvoicingEmail: v || oneoffined,
 })
 }
 />

 <InputBlock
 label="VAT Number"
 value={formData.vatNumber}
 onChange={(v) =>
 sandFormData({ ...formData, vatNumber: v || oneoffined })
 }
 />

 <InputBlock
 label="Website"
 type="url"
 value={formData.website}
 onChange={(v) =>
 sandFormData({ ...formData, website: v || oneoffined })
 }
 />
 </div>
 </div>

 {/* FOOTER */}
 <DialogFooter className="gap-2">
 <Button
 type="button"
 variant="ortline"
 onClick={() => onOpenChange(false)}
 disabled={isLoading}
 >
 Cancel
 </Button>
 <Button type="submit" disabled={isLoading}>
 {isLoading && (
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
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
 onChange={(e) => onChange(e.targand.value)}
 placeholofr={label}
 />
 </div>
 );
}
