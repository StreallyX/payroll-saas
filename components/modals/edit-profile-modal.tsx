"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type EditProfileModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  onSuccess?: () => void
}

export function EditProfileModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roleId: "",
    isActive: true,
    phone: "",
    dateOfBirth: "",
    countryId: "",
    city: "",
    address1: "",
    address2: "",
    postCode: "",
    companyName: "",
    vatNumber: "",
  })

  const utils = api.useUtils()
  const { data: roles = [] } = api.role.getAll.useQuery()
  const { data: countries = [] } = api.country.getAll.useQuery()

  useEffect(() => {
    if (user && open) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        roleId: user.role?.id || user.roleId || "",
        isActive: user.isActive ?? true,
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        countryId: user.country?.id || user.countryId || "",
        city: user.city || "",
        address1: user.address1 || "",
        address2: user.address2 || "",
        postCode: user.postCode || "",
        companyName: user.companyName || "",
        vatNumber: user.vatNumber || "",
      })
    }
  }, [user, open])

  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully")
      utils.user.getDetails.invalidate()
      utils.user.getAll.invalidate()
      utils.user.getByRoleType.invalidate()
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update profile")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) return toast.error("Name is required")
    if (!formData.email) return toast.error("Email is required")
    if (!formData.roleId) return toast.error("Role is required")

    updateMutation.mutate({
      id: user.id,
      name: formData.name,
      email: formData.email,
      roleId: formData.roleId,
      isActive: formData.isActive,
      phone: formData.phone || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      countryId: formData.countryId || undefined,
      city: formData.city || undefined,
      address1: formData.address1 || undefined,
      address2: formData.address2 || undefined,
      postCode: formData.postCode || undefined,
      companyName: formData.companyName || undefined,
      vatNumber: formData.vatNumber || undefined,
    })
  }

  const isLoading = updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update profile information for {user?.name || user?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Basic Info Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="name" className="text-sm">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-sm">Role *</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((role: any) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName || role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-sm">Status</Label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value === "active" })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="phone" className="text-sm">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isLoading}
                    placeholder="+1 (555) 123-4567"
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dateOfBirth" className="text-sm">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Address</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-sm">Country</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((country: any) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="city" className="text-sm">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="address1" className="text-sm">Address Line 1</Label>
                <Input
                  id="address1"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  disabled={isLoading}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="address2" className="text-sm">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={formData.address2}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="postCode" className="text-sm">Post Code</Label>
                  <Input
                    id="postCode"
                    value={formData.postCode}
                    onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Business Info Section */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Business Information</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="companyName" className="text-sm">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="vatNumber" className="text-sm">VAT / Tax ID</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
