"use client";

import { useState } from "react";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  User,
  Building2,
  Landmark,
  Shield,
  FileText,
} from "lucide-react";

import { useProfile } from "@/hooks/useProfile";

import { UserSection } from "./sections/UserSection";
import { CompanySection } from "./sections/CompanySection";
import { BankSection } from "./sections/BankSection";
import { SecuritySection } from "./sections/SecuritySection";
import { DocumentSection } from "./sections/DocumentSection";

const MENU = [
  { key: "user", label: "Personal Info", icon: User },
  { key: "company", label: "Company", icon: Building2 },
  { key: "bank", label: "Bank Accounts", icon: Landmark },
  { key: "security", label: "Security", icon: Shield },
  { key: "documents", label: "Documents", icon: FileText },
];

export default function ProfilePage() {
  const {
    data,
    isLoading,
    error,

    // forms
    userForm,
    setUserForm,
    companyForm,
    setCompanyForm,
    bankForm,
    setBankForm,

    // flags
    isEditingUser,
    setIsEditingUser,
    isEditingCompany,
    setIsEditingCompany,
    isEditingBank,
    setIsEditingBank,

    // handlers
    handleSaveUser,
    handleCancelUser,
    handleSaveCompany,
    handleCancelCompany,
    handleSaveBank,
    handleCancelBank,

    // db entities
    user,
    company,
    bank,
    documents,

    // loading states
    savingUser,
    savingCompany,
    savingBank,
  } = useProfile();

  const [active, setActive] = useState("user");

  // LOADING
  if (isLoading) {
    return (
      <RouteGuard permission="user.read.own">
        <PageHeader title="My Profile" description="Loading..." />
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          Loading profile...
        </div>
      </RouteGuard>
    );
  }

  // ERROR
  if (error || !data?.user) {
    return (
      <RouteGuard permission="user.read.own">
        <PageHeader title="My Profile" description="Manage your profile" />
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as any)?.message || "Failed to load profile."}
          </AlertDescription>
        </Alert>
      </RouteGuard>
    );
  }

  // CHOOSE SECTION
  const renderSection = () => {
    if (!userForm || !companyForm)
      return (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          Loading profile…
        </div>
      );

    switch (active) {
      case "user":
        return (
          <UserSection
            form={userForm}
            setForm={setUserForm}
            isEditing={isEditingUser}
            setIsEditing={setIsEditingUser}
            onSave={handleSaveUser}
            onCancel={handleCancelUser}
            saving={savingUser}
          />
        );

      case "company":
        return (
          <CompanySection
            form={companyForm}
            setForm={setCompanyForm}
            isEditing={isEditingCompany}
            setIsEditing={setIsEditingCompany}
            onSave={handleSaveCompany}
            onCancel={handleCancelCompany}
            saving={savingCompany}
            hasCompany={!!company}
          />
        );

      case "bank":
        return <BankSection />;

      case "security":
        return (
          <SecuritySection
            email={user!.email}
            roleName={user!.role?.name}
            twoFactorEnabled={user!.twoFactorEnabled}
            isActive={user!.isActive}
            lastLoginAt={user!.lastLoginAt}
          />
        );

      case "documents":
        return <DocumentSection documents={documents} />;
    }
  };

  return (
    <RouteGuard permission="user.read.own">
      <PageHeader
        title="My Profile"
        description="Manage your personal data, company, bank accounts and security"
      />

      <div className="flex gap-8 mt-6">
        {/* LEFT MENU */}
        <nav className="w-64 rounded-xl border bg-card p-4 flex flex-col gap-1">
          {MENU.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
              onClick={() => setActive(key)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* MAIN CONTENT */}
        <div className="flex-1">{renderSection()}</div>
      </div>
    </RouteGuard>
  );
}
