"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import {
  ArrowLeft,
  User,
  Building2,
  Landmark,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Send,
  Plus,
  Globe,
  Edit,
  Trash2,
  FileText,
} from "lucide-react"
import { DocumentList } from "@/components/documents/DocumentList"
import { formatDate } from "@/lib/utils"

export default function ContractorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractorId = params.id as string

  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingCompany, setIsEditingCompany] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [companyFormData, setCompanyFormData] = useState<any>({})

  // Bank modal state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [selectedBank, setSelectedBank] = useState<any>(null)
  const [bankFormData, setBankFormData] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",
    routingNumber: "",
    sortCode: "",
    currency: "",
    isPrimary: false,
  })

  const { data: contractor, isLoading, refetch } = api.user.getDetails.useQuery({ id: contractorId })
  const { data: contractorCompanies = [], refetch: refetchCompanies } = api.company.getByOwner.useQuery(
    { ownerId: contractorId },
    { enabled: !!contractorId }
  )
  const { data: contractorBanks = [], refetch: refetchBanks } = api.bank.getByUserId.useQuery(
    { userId: contractorId },
    { enabled: !!contractorId }
  )
  const { data: countries = [] } = api.country.getAll.useQuery()
  const utils = api.useUtils()

  // Get the contractor's company (first one, or null)
  const contractorCompany = contractorCompanies[0] || null

  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("Contractor updated successfully")
      refetch()
      utils.user.getByRoleType.invalidate()
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update")
    },
  })

  const createCompanyMutation = api.company.create.useMutation({
    onSuccess: () => {
      toast.success("Company created successfully")
      refetchCompanies()
      setIsEditingCompany(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create company")
    },
  })

  const updateCompanyMutation = api.company.update.useMutation({
    onSuccess: () => {
      toast.success("Company updated successfully")
      refetchCompanies()
      setIsEditingCompany(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update company")
    },
  })

  const resendInvitationMutation = api.user.resendInvitation.useMutation({
    onSuccess: () => toast.success("Invitation sent!"),
    onError: (error: any) => toast.error(error?.message || "Failed to send"),
  })

  // Bank mutations
  const createBankMutation = api.bank.createForUser.useMutation({
    onSuccess: () => {
      toast.success("Bank account added successfully")
      refetchBanks()
      refetch()
      closeBankModal()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add bank account")
    },
  })

  const updateBankMutation = api.bank.update.useMutation({
    onSuccess: () => {
      toast.success("Bank account updated successfully")
      refetchBanks()
      refetch()
      closeBankModal()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update bank account")
    },
  })

  const deleteBankMutation = api.bank.delete.useMutation({
    onSuccess: () => {
      toast.success("Bank account deleted")
      refetchBanks()
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete bank account")
    },
  })

  // Initialize form when contractor loads
  const initForm = () => {
    if (contractor) {
      // Split name into firstName and surname
      const nameParts = (contractor.name || "").split(" ")
      const firstName = nameParts[0] || ""
      const surname = nameParts.slice(1).join(" ") || ""

      setFormData({
        firstName,
        surname,
        email: contractor.email || "",
        phone: contractor.phone || "",
        dateOfBirth: contractor.dateOfBirth ? new Date(contractor.dateOfBirth).toISOString().split('T')[0] : "",
        countryId: contractor.country?.id || "",
        city: contractor.city || "",
        address1: contractor.address1 || "",
        address2: contractor.address2 || "",
        postCode: contractor.postCode || "",
        roleId: contractor.role?.id || "",
        isActive: contractor.isActive ?? true,
      })
    }
  }

  // Initialize company form
  const initCompanyForm = () => {
    if (contractorCompany) {
      setCompanyFormData({
        id: contractorCompany.id,
        name: contractorCompany.name || "",
        vatNumber: contractorCompany.vatNumber || "",
        website: contractorCompany.website || "",
        address1: contractorCompany.address1 || "",
        address2: contractorCompany.address2 || "",
        city: contractorCompany.city || "",
        countryId: contractorCompany.countryId || "",
        postCode: contractorCompany.postCode || "",
        contactEmail: contractorCompany.contactEmail || "",
        contactPhone: contractorCompany.contactPhone || "",
      })
    } else {
      // New company - pre-fill with contractor info
      setCompanyFormData({
        name: "",
        vatNumber: "",
        website: "",
        address1: contractor?.address1 || "",
        address2: contractor?.address2 || "",
        city: contractor?.city || "",
        countryId: contractor?.country?.id || "",
        postCode: contractor?.postCode || "",
        contactEmail: contractor?.email || "",
        contactPhone: contractor?.phone || "",
      })
    }
  }

  const handleEdit = () => {
    initForm()
    setIsEditing(true)
  }

  const handleEditCompany = () => {
    initCompanyForm()
    setIsEditingCompany(true)
  }

  const handleSave = () => {
    if (!formData.firstName) return toast.error("First name is required")
    if (!formData.email) return toast.error("Email is required")

    // Combine firstName and surname into name
    const fullName = formData.surname
      ? `${formData.firstName} ${formData.surname}`.trim()
      : formData.firstName.trim()

    updateMutation.mutate({
      id: contractorId,
      name: fullName,
      email: formData.email,
      roleId: formData.roleId || contractor?.role?.id,
      isActive: formData.isActive,
      phone: formData.phone || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      countryId: formData.countryId || undefined,
      city: formData.city || undefined,
      address1: formData.address1 || undefined,
      address2: formData.address2 || undefined,
      postCode: formData.postCode || undefined,
    })
  }

  const handleSaveCompany = () => {
    if (!companyFormData.name) return toast.error("Company name is required")

    if (companyFormData.id) {
      // Update existing company
      updateCompanyMutation.mutate({
        id: companyFormData.id,
        name: companyFormData.name,
        vatNumber: companyFormData.vatNumber || undefined,
        website: companyFormData.website || undefined,
        address1: companyFormData.address1 || undefined,
        address2: companyFormData.address2 || undefined,
        city: companyFormData.city || undefined,
        countryId: companyFormData.countryId || undefined,
        postCode: companyFormData.postCode || undefined,
        contactEmail: companyFormData.contactEmail || undefined,
        contactPhone: companyFormData.contactPhone || undefined,
      })
    } else {
      // Create new company for contractor
      createCompanyMutation.mutate({
        name: companyFormData.name,
        ownerType: "user",
        ownerId: contractorId,
        vatNumber: companyFormData.vatNumber || undefined,
        website: companyFormData.website || undefined,
        address1: companyFormData.address1 || undefined,
        address2: companyFormData.address2 || undefined,
        city: companyFormData.city || undefined,
        countryId: companyFormData.countryId || undefined,
        postCode: companyFormData.postCode || undefined,
        contactEmail: companyFormData.contactEmail || undefined,
        contactPhone: companyFormData.contactPhone || undefined,
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
  }

  const handleCancelCompany = () => {
    setIsEditingCompany(false)
    setCompanyFormData({})
  }

  // Bank modal functions
  const openBankModal = (bank?: any) => {
    if (bank) {
      setSelectedBank(bank)
      setBankFormData({
        bankName: bank.bankName || "",
        accountHolder: bank.accountHolder || "",
        accountNumber: bank.accountNumber || "",
        iban: bank.iban || "",
        swiftCode: bank.swiftCode || "",
        routingNumber: bank.routingNumber || "",
        sortCode: bank.sortCode || "",
        currency: bank.currency || "",
        isPrimary: bank.isPrimary || false,
      })
    } else {
      setSelectedBank(null)
      setBankFormData({
        bankName: "",
        accountHolder: contractor?.name || "",
        accountNumber: "",
        iban: "",
        swiftCode: "",
        routingNumber: "",
        sortCode: "",
        currency: "",
        isPrimary: false,
      })
    }
    setIsBankModalOpen(true)
  }

  const closeBankModal = () => {
    setIsBankModalOpen(false)
    setSelectedBank(null)
    setBankFormData({
      bankName: "",
      accountHolder: "",
      accountNumber: "",
      iban: "",
      swiftCode: "",
      routingNumber: "",
      sortCode: "",
      currency: "",
      isPrimary: false,
    })
  }

  const handleSaveBank = () => {
    if (!bankFormData.bankName) return toast.error("Bank name is required")

    if (selectedBank) {
      // Update existing bank
      updateBankMutation.mutate({
        id: selectedBank.id,
        bankName: bankFormData.bankName,
        accountHolder: bankFormData.accountHolder || undefined,
        accountNumber: bankFormData.accountNumber || undefined,
        iban: bankFormData.iban || undefined,
        swiftCode: bankFormData.swiftCode || undefined,
        routingNumber: bankFormData.routingNumber || undefined,
        sortCode: bankFormData.sortCode || undefined,
        currency: bankFormData.currency || undefined,
        isPrimary: bankFormData.isPrimary,
      })
    } else {
      // Create new bank for contractor
      createBankMutation.mutate({
        userId: contractorId,
        bankName: bankFormData.bankName,
        accountHolder: bankFormData.accountHolder || undefined,
        accountNumber: bankFormData.accountNumber || undefined,
        iban: bankFormData.iban || undefined,
        swiftCode: bankFormData.swiftCode || undefined,
        routingNumber: bankFormData.routingNumber || undefined,
        sortCode: bankFormData.sortCode || undefined,
        currency: bankFormData.currency || undefined,
        isPrimary: bankFormData.isPrimary,
      })
    }
  }

  const handleDeleteBank = (bankId: string) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      deleteBankMutation.mutate({ id: bankId })
    }
  }

  const isSavingBank = createBankMutation.isPending || updateBankMutation.isPending

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contractor Not Found" />
        <Button onClick={() => router.push("/contractors")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contractors
        </Button>
      </div>
    )
  }

  // Split contractor name for display
  const contractorNameParts = (contractor.name || "").split(" ")
  const contractorFirstName = contractorNameParts[0] || ""
  const contractorSurname = contractorNameParts.slice(1).join(" ") || ""

  const displayData = isEditing ? formData : {
    firstName: contractorFirstName,
    surname: contractorSurname,
    email: contractor.email,
    phone: contractor.phone,
    dateOfBirth: contractor.dateOfBirth ? new Date(contractor.dateOfBirth).toISOString().split('T')[0] : "",
    countryId: contractor.country?.id,
    city: contractor.city,
    address1: contractor.address1,
    address2: contractor.address2,
    postCode: contractor.postCode,
    isActive: contractor.isActive,
  }

  const companyDisplayData = isEditingCompany ? companyFormData : contractorCompany ? {
    name: contractorCompany.name,
    vatNumber: contractorCompany.vatNumber,
    website: contractorCompany.website,
    address1: contractorCompany.address1,
    address2: contractorCompany.address2,
    city: contractorCompany.city,
    countryId: contractorCompany.countryId,
    postCode: contractorCompany.postCode,
    contactEmail: contractorCompany.contactEmail,
    contactPhone: contractorCompany.contactPhone,
  } : null

  const isSavingCompany = createCompanyMutation.isPending || updateCompanyMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/contractors")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{contractor.name || "Contractor"}</h1>
            <p className="text-sm text-muted-foreground">{contractor.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resendInvitationMutation.mutate({ userId: contractorId })}
            disabled={resendInvitationMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Resend Invite
          </Button>
          {activeTab === "personal" && (
            isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleEdit}>
                Edit Contractor
              </Button>
            )
          )}
          {activeTab === "company" && (
            isEditingCompany ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancelCompany}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveCompany} disabled={isSavingCompany}>
                  {isSavingCompany ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {contractorCompany ? "Save Company" : "Create Company"}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleEditCompany}>
                {contractorCompany ? "Edit Company" : "Add Company"}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex gap-2">
        <Badge variant={contractor.isActive ? "default" : "secondary"}>
          {contractor.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant="outline">{contractor.role?.displayName || contractor.role?.name}</Badge>
        {contractor.onboardingStatus && (
          <Badge variant={contractor.onboardingStatus === "completed" ? "default" : "secondary"}>
            Onboarding: {contractor.onboardingStatus}
          </Badge>
        )}
        {contractorCompany && (
          <Badge variant="outline" className="bg-blue-50">
            <Building2 className="h-3 w-3 mr-1" />
            Has Company
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="personal">
            <User className="h-4 w-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="bank">
            <Landmark className="h-4 w-4 mr-2" />
            Bank
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Basic contact and identity information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={displayData.firstName || ""}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Surname</Label>
                  <Input
                    value={displayData.surname || ""}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Surname"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      className="pl-9"
                      value={displayData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={displayData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Not provided"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={displayData.dateOfBirth || ""}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label>Account Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isActive ? "User can log in" : "User cannot log in"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Address</CardTitle>
              <CardDescription>Location information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={displayData.countryId || ""}
                    onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={displayData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Not provided"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={displayData.address1 || ""}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Not provided"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Input
                    value={displayData.address2 || ""}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Not provided"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Post Code</Label>
                  <Input
                    value={displayData.postCode || ""}
                    onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Not provided"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-4">
          {!contractorCompany && !isEditingCompany ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium mb-2">No Company Registered</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This contractor operates as an individual. Add a company if they work as a freelancer or have a registered business.
                  </p>
                  <Button onClick={handleEditCompany}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Company Information</CardTitle>
                  <CardDescription>Business details for this contractor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={isEditingCompany ? companyFormData.name : (companyDisplayData?.name || "")}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                          disabled={!isEditingCompany}
                          placeholder="Company name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>VAT / Tax ID</Label>
                      <Input
                        value={isEditingCompany ? companyFormData.vatNumber : (companyDisplayData?.vatNumber || "")}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, vatNumber: e.target.value })}
                        disabled={!isEditingCompany}
                        placeholder="VAT number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={isEditingCompany ? companyFormData.website : (companyDisplayData?.website || "")}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                          disabled={!isEditingCompany}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          className="pl-9"
                          value={isEditingCompany ? companyFormData.contactEmail : (companyDisplayData?.contactEmail || "")}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, contactEmail: e.target.value })}
                          disabled={!isEditingCompany}
                          placeholder="contact@company.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={isEditingCompany ? companyFormData.contactPhone : (companyDisplayData?.contactPhone || "")}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, contactPhone: e.target.value })}
                          disabled={!isEditingCompany}
                          placeholder="+1 555..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Company Address</CardTitle>
                  <CardDescription>Registered business address</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select
                        value={isEditingCompany ? companyFormData.countryId : (companyDisplayData?.countryId || "")}
                        onValueChange={(value) => setCompanyFormData({ ...companyFormData, countryId: value })}
                        disabled={!isEditingCompany}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={isEditingCompany ? companyFormData.city : (companyDisplayData?.city || "")}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, city: e.target.value })}
                        disabled={!isEditingCompany}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Address Line 1</Label>
                      <Input
                        value={isEditingCompany ? companyFormData.address1 : (companyDisplayData?.address1 || "")}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, address1: e.target.value })}
                        disabled={!isEditingCompany}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address Line 2</Label>
                      <Input
                        value={isEditingCompany ? companyFormData.address2 : (companyDisplayData?.address2 || "")}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, address2: e.target.value })}
                        disabled={!isEditingCompany}
                        placeholder="Suite, floor, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Post Code</Label>
                      <Input
                        value={isEditingCompany ? companyFormData.postCode : (companyDisplayData?.postCode || "")}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, postCode: e.target.value })}
                        disabled={!isEditingCompany}
                        placeholder="Postal code"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Bank Tab */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Bank Accounts</CardTitle>
                <CardDescription>Payment information for this contractor</CardDescription>
              </div>
              <Button size="sm" onClick={() => openBankModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bank
              </Button>
            </CardHeader>
            <CardContent>
              {(contractorBanks.length > 0 || (contractor.banks && contractor.banks.length > 0)) ? (
                <div className="space-y-3">
                  {(contractorBanks.length > 0 ? contractorBanks : contractor.banks).map((account: any) => (
                    <div key={account.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Landmark className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{account.bankName || "Bank Account"}</p>
                            <p className="text-sm text-muted-foreground">
                              {account.accountNumber ? `****${account.accountNumber.slice(-4)}` : "No account number"}
                              {account.iban && ` • IBAN: ****${account.iban.slice(-4)}`}
                            </p>
                            {account.accountHolder && (
                              <p className="text-xs text-muted-foreground">{account.accountHolder}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.isPrimary && (
                            <Badge variant="secondary">Primary</Badge>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openBankModal(account)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteBank(account.id)}
                            disabled={deleteBankMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Landmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No bank accounts registered</p>
                  <p className="text-sm mb-4">Add a bank account for payment processing.</p>
                  <Button variant="outline" onClick={() => openBankModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(contractor.createdAt)}</span>
              </div>
              {contractor.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login</span>
                  <span>{formatDate(contractor.lastLoginAt)}</span>
                </div>
              )}
              {contractor.createdByUser && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created By</span>
                  <span>{contractor.createdByUser.name || contractor.createdByUser.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contractor Documents</CardTitle>
              <CardDescription>
                Upload and manage documents for this contractor such as contracts, visas, certifications, and other files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList entityType="contractor" entityId={contractorId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bank Modal */}
      <Dialog open={isBankModalOpen} onOpenChange={(open) => !open && closeBankModal()}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedBank ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
            <DialogDescription>
              {selectedBank
                ? "Update the bank account details."
                : "Add a new bank account for this contractor."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Input
                  value={bankFormData.bankName}
                  onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                  placeholder="e.g. HSBC, Emirates NBD"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Holder</Label>
                <Input
                  value={bankFormData.accountHolder}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountHolder: e.target.value })}
                  placeholder="Account holder name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={bankFormData.accountNumber}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                  placeholder="Account number"
                />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={bankFormData.iban}
                  onChange={(e) => setBankFormData({ ...bankFormData, iban: e.target.value })}
                  placeholder="IBAN"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SWIFT Code</Label>
                <Input
                  value={bankFormData.swiftCode}
                  onChange={(e) => setBankFormData({ ...bankFormData, swiftCode: e.target.value })}
                  placeholder="SWIFT / BIC"
                />
              </div>
              <div className="space-y-2">
                <Label>Routing / Sort Code</Label>
                <Input
                  value={bankFormData.routingNumber || bankFormData.sortCode}
                  onChange={(e) => setBankFormData({ ...bankFormData, routingNumber: e.target.value, sortCode: e.target.value })}
                  placeholder="Routing number or sort code"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={bankFormData.currency}
                  onChange={(e) => setBankFormData({ ...bankFormData, currency: e.target.value })}
                  placeholder="e.g. USD, EUR, GBP"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={bankFormData.isPrimary}
                  onCheckedChange={(checked) => setBankFormData({ ...bankFormData, isPrimary: checked })}
                />
                <Label>Primary Account</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeBankModal} disabled={isSavingBank}>
              Cancel
            </Button>
            <Button onClick={handleSaveBank} disabled={isSavingBank || !bankFormData.bankName}>
              {isSavingBank && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedBank ? "Update" : "Add"} Bank Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
