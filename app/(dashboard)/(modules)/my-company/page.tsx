"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import {
  Building2,
  Users,
  Save,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Plus,
  MoreHorizontal,
  Crown,
  UserCheck,
  UserX,
  Trash2,
  Send,
  Edit,
  AlertCircle,
} from "lucide-react"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"

export default function MyCompanyPage() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [userToMakeOwner, setUserToMakeOwner] = useState<any>(null)

  const companyId = session?.user?.companyId
  const isOwner = session?.user?.isCompanyOwner
  const companyRole = session?.user?.companyRole

  // Can manage if owner or admin role in company
  const canManage = isOwner || companyRole === "admin" || companyRole === "owner"

  const { data: company, isLoading, refetch } = api.company.getById.useQuery(
    { id: companyId! },
    { enabled: !!companyId }
  )

  const { data: countries = [] } = api.country.getAll.useQuery()

  const updateMutation = api.company.update.useMutation({
    onSuccess: () => {
      toast.success("Company updated successfully")
      refetch()
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update company")
    },
  })

  const removeContactMutation = api.company.removeContact.useMutation({
    onSuccess: () => {
      toast.success("Member removed from company")
      refetch()
      setUserToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to remove member")
    },
  })

  const transferOwnershipMutation = api.company.transferOwnership.useMutation({
    onSuccess: () => {
      toast.success("Ownership transferred successfully")
      refetch()
      setUserToMakeOwner(null)
      // Force session refresh
      window.location.reload()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to transfer ownership")
    },
  })

  const initForm = () => {
    if (company) {
      setFormData({
        name: company.name || "",
        vatNumber: company.vatNumber || "",
        website: company.website || "",
        contactPerson: company.contactPerson || "",
        contactEmail: company.contactEmail || "",
        contactPhone: company.contactPhone || "",
        address1: company.address1 || "",
        address2: company.address2 || "",
        city: company.city || "",
        countryId: company.countryId || "",
        postCode: company.postCode || "",
      })
    }
  }

  const handleEdit = () => {
    initForm()
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!formData.name) return toast.error("Company name is required")

    updateMutation.mutate({
      id: companyId!,
      name: formData.name,
      vatNumber: formData.vatNumber || undefined,
      website: formData.website || undefined,
      contactPerson: formData.contactPerson || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      address1: formData.address1 || undefined,
      address2: formData.address2 || undefined,
      city: formData.city || undefined,
      countryId: formData.countryId || undefined,
      postCode: formData.postCode || undefined,
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
  }

  // No company assigned
  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Company"
          description="Manage your company information"
        />
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">No Company Assigned</h3>
              <p className="text-sm text-muted-foreground">
                You are not currently assigned to any company. Please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Company" description="Manage your company information" />
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

  if (!company) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Company" description="Manage your company information" />
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Company not found.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayData = isEditing ? formData : {
    name: company.name,
    vatNumber: company.vatNumber,
    website: company.website,
    contactPerson: company.contactPerson,
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone,
    address1: company.address1,
    address2: company.address2,
    city: company.city,
    countryId: company.countryId,
    postCode: company.postCode,
  }

  const companyUsers = company.companyUsers || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="My Company"
          description={isOwner ? "You are the owner of this company" : `Your role: ${companyRole || "Member"}`}
        />
        <div className="flex gap-2">
          {canManage && (
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
                <Edit className="h-4 w-4 mr-2" />
                Edit Company
              </Button>
            )
          )}
        </div>
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={displayData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT / Tax ID</Label>
                  <Input
                    value={displayData.vatNumber || ""}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Not provided"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={displayData.website || ""}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input
                    value={displayData.contactPerson || ""}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Not provided"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      className="pl-9"
                      value={displayData.contactEmail || ""}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      disabled={!isEditing}
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
                      value={displayData.contactPhone || ""}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+1 555..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </CardTitle>
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
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={displayData.address1 || ""}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Input
                    value={displayData.address2 || ""}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Suite, floor, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Post Code</Label>
                  <Input
                    value={displayData.postCode || ""}
                    onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Postal code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </CardTitle>
                {canManage && (
                  <Button size="sm" variant="outline" onClick={() => setIsAddContactOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
              <CardDescription>
                {companyUsers.length} member{companyUsers.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyUsers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No team members yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {companyUsers.map((cu: any) => {
                    const user = cu.user
                    const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"
                    const isCuOwner = company.ownerId === user?.id

                    return (
                      <div key={cu.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{user?.name || "Unnamed"}</span>
                              {isCuOwner && (
                                <Crown className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {cu.role || "member"}
                          </Badge>
                          {canManage && !isCuOwner && user?.id !== session?.user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isOwner && (
                                  <DropdownMenuItem onClick={() => setUserToMakeOwner(cu)}>
                                    <Crown className="h-4 w-4 mr-2" />
                                    Make Owner
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setUserToDelete(cu)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        open={isAddContactOpen}
        onOpenChange={setIsAddContactOpen}
        companyId={companyId}
        companyName={company.name}
        onSuccess={() => {
          refetch()
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            removeContactMutation.mutate({
              companyId,
              userId: userToDelete.user.id,
            })
          }
        }}
        title="Remove Team Member"
        description={`Are you sure you want to remove "${userToDelete?.user?.name || userToDelete?.user?.email}" from the company?`}
        isLoading={removeContactMutation.isPending}
      />

      {/* Transfer Ownership Confirmation */}
      <DeleteConfirmDialog
        open={!!userToMakeOwner}
        onOpenChange={(open) => !open && setUserToMakeOwner(null)}
        onConfirm={() => {
          if (userToMakeOwner) {
            transferOwnershipMutation.mutate({
              companyId,
              newOwnerId: userToMakeOwner.user.id,
            })
          }
        }}
        title="Transfer Ownership"
        description={`Are you sure you want to transfer ownership to "${userToMakeOwner?.user?.name || userToMakeOwner?.user?.email}"? You will become a regular admin.`}
        isLoading={transferOwnershipMutation.isPending}
        confirmText="Transfer"
        variant="default"
      />
    </div>
  )
}
