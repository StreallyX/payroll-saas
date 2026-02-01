"use client";

import { useState } from "react";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

function ProfileSkeleton() {
  return (
    <div className="flex gap-6 mt-6">
      {/* Sidebar Skeleton */}
      <div className="w-56 space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Content Skeleton */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const {
    data,
    isLoading,
    error,
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
    handleSaveUser,
    handleCancelUser,
    handleSaveCompany,
    handleCancelCompany,
    handleSaveBank,
    handleCancelBank,
    user,
    company,
    bank,
    documents,
    savingUser,
    savingCompany,
    savingBank,
  } = useProfile();

  const [active, setActive] = useState("user");

  // LOADING
  if (isLoading) {
    return (
      <RouteGuard permission="user.read.own">
        <PageHeader title="My Profile" description="Manage your personal information" />
        <ProfileSkeleton />
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

  // Get initials for avatar
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // CHOOSE SECTION
  const renderSection = () => {
    if (!userForm || !companyForm) {
      return (
        <Card>
          <CardContent className="py-10">
            <ProfileSkeleton />
          </CardContent>
        </Card>
      );
    }

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
        description="Manage your personal information and settings"
      />

      <div className="flex gap-6 mt-6">
        {/* LEFT SIDEBAR */}
        <div className="w-56 space-y-4">
          {/* User Card */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <Card className="p-2">
            <nav className="flex flex-col gap-1">
              {MENU.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setActive(key)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">{renderSection()}</div>
      </div>
    </RouteGuard>
  );
}
