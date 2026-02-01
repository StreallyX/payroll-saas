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
} from "lucide-react"
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

  const { data: contractor, isLoading, refetch } = api.user.getDetails.useQuery({ id: contractorId })
  const { data: contractorCompanies = [], refetch: refetchCompanies } = api.company.getByOwner.useQuery(
    { ownerId: contractorId },
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

  // Initialize form when contractor loads
  const initForm = () => {
    if (contractor) {
      setFormData({
        name: contractor.name || "",
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
    if (!formData.name) return toast.error("Name is required")
    if (!formData.email) return toast.error("Email is required")

    updateMutation.mutate({
      id: contractorId,
      name: formData.name,
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

  const displayData = isEditing ? formData : {
    name: contractor.name,
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
                  <Label>Full Name</Label>
                  <Input
                    value={displayData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
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
            <CardHeader>
              <CardTitle className="text-base">Bank Accounts</CardTitle>
              <CardDescription>Payment information for this contractor</CardDescription>
            </CardHeader>
            <CardContent>
              {contractor.banks && contractor.banks.length > 0 ? (
                <div className="space-y-3">
                  {contractor.banks.map((account: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Landmark className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{account.bankName || "Bank Account"}</p>
                            <p className="text-sm text-muted-foreground">
                              {account.accountNumber ? `****${account.accountNumber.slice(-4)}` : "No account number"}
                            </p>
                          </div>
                        </div>
                        {account.isPrimary && (
                          <Badge variant="secondary">Primary</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Landmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No bank accounts registered</p>
                  <p className="text-sm">The contractor can add bank accounts from their profile.</p>
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
      </Tabs>
    </div>
  )
}
