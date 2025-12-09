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
  postCode?: string;
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
  swiftCode?: string;
  iban?: string;
  address?: string;
};

export function useProfile() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  const [userForm, setUserForm] = useState<UserFormData | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyFormData | null>(null);
  const [bankForm, setBankForm] = useState<BankFormData | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = api.profile.getOwn.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });

  const updateProfile = api.profile.updateOwn.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated successfully." });
      setIsEditingUser(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Update failed.",
        variant: "destructive",
      });
    },
  });

  const upsertCompany = api.profile.upsertCompany.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company information saved successfully.",
      });
      setIsEditingCompany(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save company.",
        variant: "destructive",
      });
    },
  });

  const upsertBank = api.profile.upsertBank.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank information saved successfully.",
      });
      setIsEditingBank(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save bank.",
        variant: "destructive",
      });
    },
  });

  // Init forms
  useEffect(() => {
    if (!data?.user) return;

    const { user, companies, bank } = data;
    const company = companies && companies.length > 0 ? companies[0] : null;

    setUserForm({
      name: user.name || "",
      email: user.email,
      phone: user.phone || "",
      timezone: user.timezone || "UTC",
      language: user.language || "en",
    });

    setCompanyForm({
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
      postCode: company?.postCode || "",
      invoicingContactName: company?.invoicingContactName || "",
      invoicingContactPhone: company?.invoicingContactPhone || "",
      invoicingContactEmail: company?.invoicingContactEmail || "",
      alternateInvoicingEmail: company?.alternateInvoicingEmail || "",
      vatNumber: company?.vatNumber || "",
      website: company?.website || "",
    });

    setBankForm({
      name: bank?.name || "",
      accountNumber: bank?.accountNumber || "",
      swiftCode: bank?.swiftCode || "",
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
    setUserForm({
      name: user.name || "",
      email: user.email,
      phone: user.phone || "",
      timezone: user.timezone || "UTC",
      language: user.language || "en",
    });
    setIsEditingUser(false);
  };

  const handleSaveCompany = () => {
    if (!companyForm) return;
    upsertCompany.mutate({ ...companyForm });
  };

  const handleCancelCompany = () => {
    const company =
      data?.companies && data.companies.length > 0 ? data.companies[0] : null;
    setCompanyForm({
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
      postCode: company?.postCode || "",
      invoicingContactName: company?.invoicingContactName || "",
      invoicingContactPhone: company?.invoicingContactPhone || "",
      invoicingContactEmail: company?.invoicingContactEmail || "",
      alternateInvoicingEmail: company?.alternateInvoicingEmail || "",
      vatNumber: company?.vatNumber || "",
      website: company?.website || "",
    });
    setIsEditingCompany(false);
  };

  const handleSaveBank = () => {
    if (!bankForm) return;
    upsertBank.mutate({ ...bankForm });
  };

  const handleCancelBank = () => {
    const bank = data?.bank;
    setBankForm({
      name: bank?.name || "",
      accountNumber: bank?.accountNumber || "",
      swiftCode: bank?.swiftCode || "",
      iban: bank?.iban || "",
      address: bank?.address || "",
    });
    setIsEditingBank(false);
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
    refetch,

    // forms & flags
    userForm,
    setUserForm,
    companyForm,
    setCompanyForm,
    bankForm,
    setBankForm,
    isEditingUser,
    setIsEditingUser,
    isEditingCompany,
    setIsEditingCompany,
    isEditingBank,
    setIsEditingBank,

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
