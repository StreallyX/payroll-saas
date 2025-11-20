"use client";

import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  User,
  Mail,
  Phone,
  Edit,
  Save,
  AlertCircle,
  Loader2,
  Globe,
  Building2,
  Landmark,
  Shield,
  FileText,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { FormSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type UserFormData = {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
};

type CompanyFormData = {
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

type BankFormData = {
  name: string;
  accountNumber?: string;
  swiftCode?: string;
  iban?: string;
  address?: string;
};

export default function ProfilePage() {
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

  // Init forms when data is loaded
  useEffect(() => {
    if (!data?.user) return;

    const { user, company, bank } = data;

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

  if (isLoading) {
    return (
      <RouteGuard permission="user.read.own">
        <div className="space-y-6">
          <PageHeader
            title="My Profile"
            description="Manage your personal profile information"
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSkeleton />
              </CardContent>
            </Card>
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error || !data?.user || !userForm) {
    return (
      <RouteGuard permission="user.read.own">
        <div className="space-y-6">
          <PageHeader
            title="My Profile"
            description="Manage your personal profile information"
          />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || "Failed to load profile."}
            </AlertDescription>
          </Alert>
        </div>
      </RouteGuard>
    );
  }

  const { user, company, bank, documents } = data;

  // --- Handlers ------------------------------------------------------

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
    upsertCompany.mutate({
      name: companyForm.name,
      contactPerson: companyForm.contactPerson,
      contactEmail: companyForm.contactEmail,
      contactPhone: companyForm.contactPhone,
      officeBuilding: companyForm.officeBuilding,
      address1: companyForm.address1,
      address2: companyForm.address2,
      city: companyForm.city,
      countryId: companyForm.countryId,
      state: companyForm.state,
      postCode: companyForm.postCode,
      invoicingContactName: companyForm.invoicingContactName,
      invoicingContactPhone: companyForm.invoicingContactPhone,
      invoicingContactEmail: companyForm.invoicingContactEmail,
      alternateInvoicingEmail: companyForm.alternateInvoicingEmail,
      vatNumber: companyForm.vatNumber,
      website: companyForm.website,
    });
  };

  const handleCancelCompany = () => {
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
    upsertBank.mutate({
      name: bankForm.name,
      accountNumber: bankForm.accountNumber,
      swiftCode: bankForm.swiftCode,
      iban: bankForm.iban,
      address: bankForm.address,
    });
  };

  const handleCancelBank = () => {
    setBankForm({
      name: bank?.name || "",
      accountNumber: bank?.accountNumber || "",
      swiftCode: bank?.swiftCode || "",
      iban: bank?.iban || "",
      address: bank?.address || "",
    });
    setIsEditingBank(false);
  };

  // -------------------------------------------------------------------

  return (
    <RouteGuard permission="user.read.own">
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="Manage your personal profile, company, bank and security information"
        />
        <div className="grid gap-6 xl:grid-cols-2">
          {/* ================= USER INFO ================= */}
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic profile details</CardDescription>
              </div>
              {!isEditingUser ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingUser(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, name: e.target.value })
                  }
                  disabled={!isEditingUser}
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={userForm.email}
                    disabled
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-9"
                    value={userForm.phone}
                    onChange={(e) =>
                      setUserForm({ ...userForm, phone: e.target.value })
                    }
                    disabled={!isEditingUser}
                  />
                </div>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={userForm.language}
                  onChange={(e) =>
                    setUserForm({ ...userForm, language: e.target.value })
                  }
                  disabled={!isEditingUser}
                />
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="timezone"
                    className="pl-9"
                    value={userForm.timezone}
                    onChange={(e) =>
                      setUserForm({ ...userForm, timezone: e.target.value })
                    }
                    disabled={!isEditingUser}
                  />
                </div>
              </div>

              {isEditingUser && (
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={handleCancelUser}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveUser}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ================= COMPANY INFO ================= */}
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company
                </CardTitle>
                <CardDescription>
                  The company you are attached to (if any)
                </CardDescription>
              </div>
              {!isEditingCompany ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingCompany(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {company ? "Edit" : "Create"}
                </Button>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-4">
              {companyForm ? (
                <>
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={companyForm.name}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          name: e.target.value,
                        })
                      }
                      disabled={!isEditingCompany}
                    />
                  </div>

                  {/* Contact */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Person</Label>
                      <Input
                        value={companyForm.contactPerson || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            contactPerson: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input
                        value={companyForm.contactEmail || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            contactEmail: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        value={companyForm.contactPhone || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            contactPhone: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Office Building</Label>
                      <Input
                        value={companyForm.officeBuilding || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            officeBuilding: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label>Address Line 1</Label>
                    <Input
                      value={companyForm.address1 || ""}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          address1: e.target.value,
                        })
                      }
                      disabled={!isEditingCompany}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2</Label>
                    <Input
                      value={companyForm.address2 || ""}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          address2: e.target.value,
                        })
                      }
                      disabled={!isEditingCompany}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={companyForm.city || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            city: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={companyForm.state || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            state: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Post Code</Label>
                      <Input
                        value={companyForm.postCode || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            postCode: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Country ID</Label>
                      <Input
                        value={companyForm.countryId || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            countryId: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={companyForm.website || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            website: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                  </div>

                  {/* Invoicing */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Invoicing Contact Name</Label>
                      <Input
                        value={companyForm.invoicingContactName || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            invoicingContactName: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoicing Contact Phone</Label>
                      <Input
                        value={companyForm.invoicingContactPhone || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            invoicingContactPhone: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Invoicing Contact Email</Label>
                      <Input
                        value={companyForm.invoicingContactEmail || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            invoicingContactEmail: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alternate Invoicing Email</Label>
                      <Input
                        value={companyForm.alternateInvoicingEmail || ""}
                        onChange={(e) =>
                          setCompanyForm({
                            ...companyForm,
                            alternateInvoicingEmail: e.target.value,
                          })
                        }
                        disabled={!isEditingCompany}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>VAT Number</Label>
                    <Input
                      value={companyForm.vatNumber || ""}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          vatNumber: e.target.value,
                        })
                      }
                      disabled={!isEditingCompany}
                    />
                  </div>

                  {isEditingCompany && (
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={handleCancelCompany}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveCompany}
                        disabled={upsertCompany.isPending}
                      >
                        {upsertCompany.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Company
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No company information available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* ================= BANK INFO ================= */}
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Bank Details
                </CardTitle>
                <CardDescription>
                  Your bank information for payments
                </CardDescription>
              </div>
              {!isEditingBank ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingBank(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {bank ? "Edit" : "Create"}
                </Button>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-4">
              {bankForm ? (
                <>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={bankForm.name}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, name: e.target.value })
                      }
                      disabled={!isEditingBank}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={bankForm.accountNumber || ""}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          accountNumber: e.target.value,
                        })
                      }
                      disabled={!isEditingBank}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input
                      value={bankForm.iban || ""}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, iban: e.target.value })
                      }
                      disabled={!isEditingBank}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>SWIFT/BIC</Label>
                    <Input
                      value={bankForm.swiftCode || ""}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          swiftCode: e.target.value,
                        })
                      }
                      disabled={!isEditingBank}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bank Address</Label>
                    <Input
                      value={bankForm.address || ""}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          address: e.target.value,
                        })
                      }
                      disabled={!isEditingBank}
                    />
                  </div>

                  {isEditingBank && (
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={handleCancelBank}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveBank}
                        disabled={upsertBank.isPending}
                      >
                        {upsertBank.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Bank
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No bank information available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ================= LOGIN / SECURITY + DOCUMENTS ================= */}
          <div className="space-y-6">
            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Login & Security
                </CardTitle>
                <CardDescription>
                  Authentication and security information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <span className="text-sm font-medium">
                    {user.role?.name || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Two-Factor Authentication
                  </span>
                  <Badge variant={user.twoFactorEnabled ? "default" : "outline"}>
                    {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Account Status
                  </span>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Login
                  </span>
                  <span className="text-sm">
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), "yyyy-MM-dd HH:mm")
                      : "Never"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Documents
                </CardTitle>
                <CardDescription>
                  Documents associated with your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{doc.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {doc.type} ·{" "}
                            {format(new Date(doc.uploadedAt), "yyyy-MM-dd HH:mm")}
                          </span>
                        </div>
                        {doc.fileUrl && (
                          <Button
                            asChild
                            size="icon"
                            variant="ghost"
                            className="ml-2"
                          >
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You don&apos;t have any documents yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
