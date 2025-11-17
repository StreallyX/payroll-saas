"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Phone, MapPin, Edit, Save, Briefcase, 
  Calendar, AlertCircle, Loader2, Building2, CreditCard,
  FileText, Lock, Plus, Trash2, Download
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { FormSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Unified Profile Page - Contractor View
 * 
 * This page serves contractors with comprehensive profile management:
 * - Personal Information
 * - Company Info (if applicable)
 * - Banking Information
 * - Files/Documents
 * - Login Information
 * 
 * Permission Required: profile.view
 * Edit Permission: profile.update
 */

export default function ProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalFormData, setPersonalFormData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("personal");

  // Banking dialog states
  const [isBankingDialogOpen, setIsBankingDialogOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);
  const [bankFormData, setBankFormData] = useState<any>({
    type: "BANK_ACCOUNT",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
    iban: "",
    isDefault: false,
  });

  // Password change states
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Determine user type
  const userType = session?.user?.roleName?.toLowerCase() || "user";
  const isContractor = userType.toLowerCase().includes("contractor");

  // Fetch contractor data
  const { data: contractor, isLoading: contractorLoading, error: contractorError, refetch: refetchContractor } = api.contractor.getByUserId.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id && isContractor }
  );

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading, refetch: refetchPaymentMethods } = api.paymentMethod.getOwn.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  );

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = api.document.getOwn.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  );

  // Fetch company data if contractor has a contract with a company
  const companyId = contractor?.contracts?.[0]?.companyId;
  const { data: company } = api.company.getById.useQuery(
    { id: companyId || "" },
    { enabled: !!companyId }
  );

  // Update contractor mutation
  const updateContractor = api.contractor.updateOwn.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your information has been updated successfully.",
      });
      setIsEditingPersonal(false);
      refetchContractor();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update information.",
        variant: "destructive",
      });
    },
  });

  // Payment method mutations
  const createPaymentMethod = api.paymentMethod.createOwn.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Banking information added successfully.",
      });
      setIsBankingDialogOpen(false);
      setBankFormData({
        type: "BANK_ACCOUNT",
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        routingNumber: "",
        swiftCode: "",
        iban: "",
        isDefault: false,
      });
      refetchPaymentMethods();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add banking information.",
        variant: "destructive",
      });
    },
  });

  const updatePaymentMethod = api.paymentMethod.updateOwn.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Banking information updated successfully.",
      });
      setIsBankingDialogOpen(false);
      setEditingPaymentMethod(null);
      refetchPaymentMethods();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update banking information.",
        variant: "destructive",
      });
    },
  });

  const deletePaymentMethod = api.paymentMethod.deleteOwn.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Banking information deleted successfully.",
      });
      refetchPaymentMethods();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete banking information.",
        variant: "destructive",
      });
    },
  });

  // Initialize form data
  useEffect(() => {
    if (contractor) {
      setPersonalFormData({
        name: contractor.user?.name || "",
        phone: contractor.phone || "",
        alternatePhone: contractor.alternatePhone || "",
        address1: contractor.address1 || "",
        city: contractor.city || "",
        state: contractor.state || "",
        postCode: contractor.postCode || "",
        countryId: contractor.countryId || "",
        dateOfBirth: contractor.dateOfBirth ? new Date(contractor.dateOfBirth).toISOString().split('T')[0] : "",
        skypeId: contractor.skypeId || "",
        notes: contractor.notes || "",
      });
    }
  }, [contractor]);

  const handleSavePersonal = () => {
    if (!personalFormData) return;
    updateContractor.mutate(personalFormData);
  };

  const handleCancelPersonal = () => {
    if (contractor) {
      setPersonalFormData({
        name: contractor.user?.name || "",
        phone: contractor.phone || "",
        alternatePhone: contractor.alternatePhone || "",
        address1: contractor.address1 || "",
        city: contractor.city || "",
        state: contractor.state || "",
        postCode: contractor.postCode || "",
        countryId: contractor.countryId || "",
        dateOfBirth: contractor.dateOfBirth ? new Date(contractor.dateOfBirth).toISOString().split('T')[0] : "",
        skypeId: contractor.skypeId || "",
        notes: contractor.notes || "",
      });
    }
    setIsEditingPersonal(false);
  };

  const handleSaveBanking = () => {
    if (editingPaymentMethod) {
      updatePaymentMethod.mutate({
        id: editingPaymentMethod.id,
        ...bankFormData,
      });
    } else {
      createPaymentMethod.mutate(bankFormData);
    }
  };

  const handleEditPaymentMethod = (paymentMethod: any) => {
    setEditingPaymentMethod(paymentMethod);
    setBankFormData({
      type: paymentMethod.type,
      bankName: paymentMethod.bankName || "",
      accountHolderName: paymentMethod.accountHolderName || "",
      accountNumber: paymentMethod.accountNumber || "",
      routingNumber: paymentMethod.routingNumber || "",
      swiftCode: paymentMethod.swiftCode || "",
      iban: paymentMethod.iban || "",
      isDefault: paymentMethod.isDefault,
    });
    setIsBankingDialogOpen(true);
  };

  const handleDeletePaymentMethod = (id: string) => {
    if (confirm("Are you sure you want to delete this payment method?")) {
      deletePaymentMethod.mutate({ id });
    }
  };

  const isLoading = contractorLoading;
  const error = contractorError;

  if (isLoading) {
    return (
      <RouteGuard permission="profile.view">
        <div className="space-y-6">
          <PageHeader
            title="My Profile"
            description="Manage your personal profile and contact information"
          />
          <FormSkeleton />
        </div>
      </RouteGuard>
    );
  }

  if (error || (!contractor && isContractor)) {
    return (
      <RouteGuard permission="profile.view">
        <div className="space-y-6">
          <PageHeader
            title="My Profile"
            description="Manage your personal profile and contact information"
          />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || "Failed to load profile information. Please try again."}
            </AlertDescription>
          </Alert>
        </div>
      </RouteGuard>
    );
  }

  if (!personalFormData) return null;

  return (
    <RouteGuard permission="profile.view">
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="Manage your personal profile and settings"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="company">
              <Building2 className="h-4 w-4 mr-2" />
              Company Info
            </TabsTrigger>
            <TabsTrigger value="banking">
              <CreditCard className="h-4 w-4 mr-2" />
              Banking
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="login">
              <Lock className="h-4 w-4 mr-2" />
              Login Info
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={personalFormData.name}
                      onChange={(e) => setPersonalFormData({ ...personalFormData, name: e.target.value })}
                      disabled={!isEditingPersonal}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-9"
                        value={contractor?.user?.email || ""}
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        className="pl-9"
                        value={personalFormData.phone}
                        onChange={(e) => setPersonalFormData({ ...personalFormData, phone: e.target.value })}
                        disabled={!isEditingPersonal}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternatePhone">Alternate Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="alternatePhone"
                        type="tel"
                        className="pl-9"
                        value={personalFormData.alternatePhone}
                        onChange={(e) => setPersonalFormData({ ...personalFormData, alternatePhone: e.target.value })}
                        disabled={!isEditingPersonal}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="pl-9"
                        value={personalFormData.dateOfBirth}
                        onChange={(e) => setPersonalFormData({ ...personalFormData, dateOfBirth: e.target.value })}
                        disabled={!isEditingPersonal}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skypeId">Skype ID</Label>
                    <Input
                      id="skypeId"
                      value={personalFormData.skypeId}
                      onChange={(e) => setPersonalFormData({ ...personalFormData, skypeId: e.target.value })}
                      disabled={!isEditingPersonal}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address Information
                  </CardTitle>
                  <CardDescription>
                    Your residential address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={personalFormData.address1}
                      onChange={(e) => setPersonalFormData({ ...personalFormData, address1: e.target.value })}
                      disabled={!isEditingPersonal}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={personalFormData.city}
                        onChange={(e) => setPersonalFormData({ ...personalFormData, city: e.target.value })}
                        disabled={!isEditingPersonal}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={personalFormData.state}
                        onChange={(e) => setPersonalFormData({ ...personalFormData, state: e.target.value })}
                        disabled={!isEditingPersonal}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postCode">ZIP/Postal Code</Label>
                    <Input
                      id="postCode"
                      value={personalFormData.postCode}
                      onChange={(e) => setPersonalFormData({ ...personalFormData, postCode: e.target.value })}
                      disabled={!isEditingPersonal}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      value={personalFormData.notes}
                      onChange={(e) => setPersonalFormData({ ...personalFormData, notes: e.target.value })}
                      disabled={!isEditingPersonal}
                      placeholder="Any additional information..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              {isEditingPersonal ? (
                <>
                  <Button variant="outline" onClick={handleCancelPersonal} disabled={updateContractor.isPending}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePersonal} disabled={updateContractor.isPending}>
                    {updateContractor.isPending ? (
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
                </>
              ) : (
                <Button onClick={() => setIsEditingPersonal(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Company Info Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Information about your associated company
                </CardDescription>
              </CardHeader>
              <CardContent>
                {company ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Company Name</Label>
                        <p className="font-medium">{company.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Contact Person</Label>
                        <p className="font-medium">{company.contactPerson || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Contact Email</Label>
                        <p className="font-medium">{company.contactEmail || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Contact Phone</Label>
                        <p className="font-medium">{company.contactPhone || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Address</Label>
                        <p className="font-medium">
                          {[company.address1, company.city, company.state, company.postCode]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">VAT Number</Label>
                        <p className="font-medium">{company.vatNumber || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Website</Label>
                        <p className="font-medium">{company.website || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <Badge variant={company.status === "active" ? "default" : "secondary"}>
                          {company.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : contractor?.contracts && contractor.contracts.length > 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have contracts but no company information is available.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You are not currently associated with any company.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Active Contracts */}
                {contractor?.contracts && contractor.contracts.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Your Contracts</h4>
                    <div className="space-y-3">
                      {contractor.contracts.map((contract: any) => (
                        <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{contract.contractReference || "Contract"}</p>
                            <p className="text-sm text-muted-foreground">
                              {contract.agency?.name || "Direct Contract"}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                              {contract.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banking Info Tab */}
          <TabsContent value="banking" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Banking Information
                    </CardTitle>
                    <CardDescription>
                      Manage your payment methods for receiving payments
                    </CardDescription>
                  </div>
                  <Dialog open={isBankingDialogOpen} onOpenChange={setIsBankingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingPaymentMethod(null);
                        setBankFormData({
                          type: "BANK_ACCOUNT",
                          bankName: "",
                          accountHolderName: "",
                          accountNumber: "",
                          routingNumber: "",
                          swiftCode: "",
                          iban: "",
                          isDefault: false,
                        });
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingPaymentMethod ? "Edit Payment Method" : "Add Payment Method"}
                        </DialogTitle>
                        <DialogDescription>
                          Enter your banking information for receiving payments
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            value={bankFormData.bankName}
                            onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="accountHolderName">Account Holder Name</Label>
                          <Input
                            id="accountHolderName"
                            value={bankFormData.accountHolderName}
                            onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            value={bankFormData.accountNumber}
                            onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="routingNumber">Routing Number</Label>
                          <Input
                            id="routingNumber"
                            value={bankFormData.routingNumber}
                            onChange={(e) => setBankFormData({ ...bankFormData, routingNumber: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                          <Input
                            id="swiftCode"
                            value={bankFormData.swiftCode}
                            onChange={(e) => setBankFormData({ ...bankFormData, swiftCode: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="iban">IBAN</Label>
                          <Input
                            id="iban"
                            value={bankFormData.iban}
                            onChange={(e) => setBankFormData({ ...bankFormData, iban: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBankingDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveBanking}
                          disabled={createPaymentMethod.isPending || updatePaymentMethod.isPending}
                        >
                          {(createPaymentMethod.isPending || updatePaymentMethod.isPending) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <FormSkeleton />
                ) : paymentMethods.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No payment methods added yet. Add one to receive payments.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((pm: any) => (
                      <div key={pm.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{pm.bankName}</p>
                            {pm.isDefault && (
                              <Badge variant="default">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pm.accountHolderName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Account: ****{pm.accountNumber?.slice(-4) || "****"}
                          </p>
                          {pm.iban && (
                            <p className="text-sm text-muted-foreground">
                              IBAN: {pm.iban}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPaymentMethod(pm)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePaymentMethod(pm.id)}
                            disabled={deletePaymentMethod.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Documents
                </CardTitle>
                <CardDescription>
                  View and manage your personal documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <FormSkeleton />
                ) : !documentsData || documentsData.documents.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No documents found. Your uploaded documents will appear here.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {documentsData.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.description || "No description"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                              {" • "}
                              Size: {(doc.fileSize / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Login Info Tab */}
          <TabsContent value="login" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Login Information
                </CardTitle>
                <CardDescription>
                  Manage your login credentials and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{contractor?.user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is your login email address
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Password</Label>
                  <p className="font-medium">••••••••</p>
                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-2">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordFormData.currentPassword}
                            onChange={(e) => setPasswordFormData({ 
                              ...passwordFormData, 
                              currentPassword: e.target.value 
                            })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordFormData.newPassword}
                            onChange={(e) => setPasswordFormData({ 
                              ...passwordFormData, 
                              newPassword: e.target.value 
                            })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordFormData.confirmPassword}
                            onChange={(e) => setPasswordFormData({ 
                              ...passwordFormData, 
                              confirmPassword: e.target.value 
                            })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          toast({
                            title: "Info",
                            description: "Password change functionality will be implemented soon.",
                          });
                          setIsPasswordDialogOpen(false);
                        }}>
                          Change Password
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div>
                  <Label className="text-muted-foreground">Account Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={contractor?.user?.isActive ? "default" : "secondary"}>
                      {contractor?.user?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Member Since</Label>
                  <p className="font-medium">
                    {contractor?.createdAt 
                      ? new Date(contractor.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "N/A"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RouteGuard>
  );
}
