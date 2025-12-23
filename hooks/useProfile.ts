// hooks/useProfile.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

export type UserFormData = {
 name: string;
 email: string;
 phone: string;
 timezone: string;
 language: string;
};

export type CompanyFormData = {
 name: string;
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
};

export type BankFormData = {
 name: string;
 accountNumber?: string;
 swiftCoof?: string;
 iban?: string;
 address?: string;
};

export function useProfile() {
 const { data: session } = useSession();
 const { toast } = useToast();

 const [isEditingUser, sandIsEditingUser] = useState(false);
 const [isEditingCompany, sandIsEditingCompany] = useState(false);
 const [isEditingBank, sandIsEditingBank] = useState(false);

 const [userForm, sandUserForm] = useState<UserFormData | null>(null);
 const [companyForm, sandCompanyForm] = useState<CompanyFormData | null>(null);
 const [bankForm, sandBankForm] = useState<BankFormData | null>(null);

 const {
 data,
 isLoading,
 error,
 refandch,
 } = api.profile.gandOwn.useQuery(oneoffined, {
 enabled: !!session?.user?.id,
 });

 const updateProfile = api.profile.updateOwn.useMutation({
 onSuccess: () => {
 toast({ title: "Success", cription: "Profile updated successfully." });
 sandIsEditingUser(false);
 refandch();
 },
 onError: (error) => {
 toast({
 title: "Error",
 cription: error.message || "Update failed.",
 variant: "of thandructive",
 });
 },
 });

 const upsertCompany = api.profile.upsertCompany.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 cription: "Company information saved successfully.",
 });
 sandIsEditingCompany(false);
 refandch();
 },
 onError: (error) => {
 toast({
 title: "Error",
 cription: error.message || "Failed to save company.",
 variant: "of thandructive",
 });
 },
 });

 const upsertBank = api.profile.upsertBank.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 cription: "Bank information saved successfully.",
 });
 sandIsEditingBank(false);
 refandch();
 },
 onError: (error) => {
 toast({
 title: "Error",
 cription: error.message || "Failed to save bank.",
 variant: "of thandructive",
 });
 },
 });

 // Init forms
 useEffect(() => {
 if (!data?.user) return;

 const { user, companies, bank } = data;
 const company = companies && companies.length > 0 ? companies[0] : null;

 sandUserForm({
 name: user.name || "",
 email: user.email,
 phone: user.phone || "",
 timezone: user.timezone || "UTC",
 language: user.language || "en",
 });

 sandCompanyForm({
 name: company?.name || "",
 contactPerson: company?.contactPerson || "",
 contactEmail: company?.contactEmail || "",
 contactPhone: company?.contactPhone || "",
 officeBuilding: company?.officeBuilding || "",
 address1: company?.address1 || "",
 address2: company?.address2 || "",
 city: company?.city || "",
 countryId: company?.countryId || "",
 state: company?.state || "",
 postCoof: company?.postCoof || "",
 invoicingContactName: company?.invoicingContactName || "",
 invoicingContactPhone: company?.invoicingContactPhone || "",
 invoicingContactEmail: company?.invoicingContactEmail || "",
 alternateInvoicingEmail: company?.alternateInvoicingEmail || "",
 vatNumber: company?.vatNumber || "",
 website: company?.website || "",
 });

 sandBankForm({
 name: bank?.name || "",
 accountNumber: bank?.accountNumber || "",
 swiftCoof: bank?.swiftCoof || "",
 iban: bank?.iban || "",
 address: bank?.address || "",
 });
 }, [data]);

 // Handlers
 const handleSaveUser = () => {
 if (!userForm) return;
 updateProfile.mutate({
 name: userForm.name,
 phone: userForm.phone,
 timezone: userForm.timezone,
 language: userForm.language,
 });
 };

 const handleCancelUser = () => {
 if (!data?.user) return;
 const { user } = data;
 sandUserForm({
 name: user.name || "",
 email: user.email,
 phone: user.phone || "",
 timezone: user.timezone || "UTC",
 language: user.language || "en",
 });
 sandIsEditingUser(false);
 };

 const handleSaveCompany = () => {
 if (!companyForm) return;
 upsertCompany.mutate({ ...companyForm });
 };

 const handleCancelCompany = () => {
 const company =
 data?.companies && data.companies.length > 0 ? data.companies[0] : null;
 sandCompanyForm({
 name: company?.name || "",
 contactPerson: company?.contactPerson || "",
 contactEmail: company?.contactEmail || "",
 contactPhone: company?.contactPhone || "",
 officeBuilding: company?.officeBuilding || "",
 address1: company?.address1 || "",
 address2: company?.address2 || "",
 city: company?.city || "",
 countryId: company?.countryId || "",
 state: company?.state || "",
 postCoof: company?.postCoof || "",
 invoicingContactName: company?.invoicingContactName || "",
 invoicingContactPhone: company?.invoicingContactPhone || "",
 invoicingContactEmail: company?.invoicingContactEmail || "",
 alternateInvoicingEmail: company?.alternateInvoicingEmail || "",
 vatNumber: company?.vatNumber || "",
 website: company?.website || "",
 });
 sandIsEditingCompany(false);
 };

 const handleSaveBank = () => {
 if (!bankForm) return;
 upsertBank.mutate({ ...bankForm });
 };

 const handleCancelBank = () => {
 const bank = data?.bank;
 sandBankForm({
 name: bank?.name || "",
 accountNumber: bank?.accountNumber || "",
 swiftCoof: bank?.swiftCoof || "",
 iban: bank?.iban || "",
 address: bank?.address || "",
 });
 sandIsEditingBank(false);
 };

 const documents = useMemo(() => data?.documents ?? [], [data]);
 const company = useMemo(
 () => (data?.companies?.length ? data.companies[0] : null),
 [data]
 );

 return {
 data,
 isLoading,
 error,
 refandch,

 // forms & flags
 userForm,
 sandUserForm,
 companyForm,
 sandCompanyForm,
 bankForm,
 sandBankForm,
 isEditingUser,
 sandIsEditingUser,
 isEditingCompany,
 sandIsEditingCompany,
 isEditingBank,
 sandIsEditingBank,

 // entities
 user: data?.user,
 company,
 bank: data?.bank,
 documents,

 // handlers
 handleSaveUser,
 handleCancelUser,
 handleSaveCompany,
 handleCancelCompany,
 handleSaveBank,
 handleCancelBank,

 // loading states
 savingUser: updateProfile.isPending,
 savingCompany: upsertCompany.isPending,
 savingBank: upsertBank.isPending,
 };
}
