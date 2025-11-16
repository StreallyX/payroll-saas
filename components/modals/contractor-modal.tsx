
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2, User, Phone, MapPin, FileText } from "lucide-react"

type ContractorModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractor?: any
  onSuccess?: (contractor?: any) => void
}

export function ContractorModal({ open, onOpenChange, contractor, onSuccess }: ContractorModalProps) {
  const [formData, setFormData] = useState({
    // User credentials (only for creation)
    name: "",
    email: "",
    password: "",
    
    // General Info
    phone: "",
    alternatePhone: "",
    dateOfBirth: "",
    referredBy: "",
    skypeId: "",
    notes: "",
    
    // Address Details
    officeBuilding: "",
    address1: "",
    address2: "",
    city: "",
    countryId: "",
    state: "",
    postCode: "",
    
    // Relations
    agencyId: "",
    onboardingTemplateId: "",
    status: "active"
  })

  const utils = api.useUtils()

  // Fetch data for dropdowns
  const { data: agencies = [] } = api.agency.getAll.useQuery()
  const { data: countries = [] } = api.country.getAll.useQuery()
  const { data: onboardingTemplates = [] } = api.onboarding.getAllTemplates.useQuery()

  useEffect(() => {
    if (contractor) {
      setFormData({
        name: contractor.user?.name || "",
        email: contractor.user?.email || "",
        password: "",
        phone: contractor.phone || "",
        alternatePhone: contractor.alternatePhone || "",
        dateOfBirth: contractor.dateOfBirth ? new Date(contractor.dateOfBirth).toISOString().split('T')[0] : "",
        referredBy: contractor.referredBy || "",
        skypeId: contractor.skypeId || "",
        notes: contractor.notes || "",
        officeBuilding: contractor.officeBuilding || "",
        address1: contractor.address1 || "",
        address2: contractor.address2 || "",
        city: contractor.city || "",
        countryId: contractor.countryId || "",
        state: contractor.state || "",
        postCode: contractor.postCode || "",
        agencyId: contractor.agencyId || "",
        onboardingTemplateId: contractor.onboardingTemplateId || "",
        status: contractor.status || "active"
      })
    }
  }, [contractor])

  const createMutation = api.contractor.create.useMutation({
    onSuccess: (data) => {
      toast.success("Contractor created successfully!")
      utils.contractor.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.(data)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create contractor")
    }
  })

  const updateMutation = api.contractor.update.useMutation({
    onSuccess: () => {
      toast.success("Contractor updated successfully!")
      utils.contractor.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update contractor")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      alternatePhone: "",
      dateOfBirth: "",
      referredBy: "",
      skypeId: "",
      notes: "",
      officeBuilding: "",
      address1: "",
      address2: "",
      city: "",
      countryId: "",
      state: "",
      postCode: "",
      agencyId: "",
      onboardingTemplateId: "",
      status: "active"
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (contractor) {
      // Update existing contractor
      updateMutation.mutate({
        id: contractor.id,
        phone: formData.phone || undefined,
        alternatePhone: formData.alternatePhone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        referredBy: formData.referredBy || undefined,
        skypeId: formData.skypeId || undefined,
        notes: formData.notes || undefined,
        officeBuilding: formData.officeBuilding || undefined,
        address1: formData.address1 || undefined,
        address2: formData.address2 || undefined,
        city: formData.city || undefined,
        countryId: formData.countryId || undefined,
        state: formData.state || undefined,
        postCode: formData.postCode || undefined,
        agencyId: formData.agencyId || undefined,
        onboardingTemplateId: formData.onboardingTemplateId || undefined,
        status: formData.status as "active" | "inactive" | "suspended"
      })
    } else {
      // Create new contractor
      if (!formData.name || !formData.email || !formData.password) {
        toast.error("Name, email and password are required")
        return
      }
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        alternatePhone: formData.alternatePhone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        referredBy: formData.referredBy || undefined,
        skypeId: formData.skypeId || undefined,
        notes: formData.notes || undefined,
        officeBuilding: formData.officeBuilding || undefined,
        address1: formData.address1 || undefined,
        address2: formData.address2 || undefined,
        city: formData.city || undefined,
        countryId: formData.countryId || undefined,
        state: formData.state || undefined,
        postCode: formData.postCode || undefined,
        agencyId: formData.agencyId || undefined,
        onboardingTemplateId: formData.onboardingTemplateId || undefined,
        status: formData.status as "active" | "inactive" | "suspended"
      })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {contractor ? "Edit Contractor" : "New Contractor"}
          </DialogTitle>
          <DialogDescription>
            {contractor 
              ? "Update contractor information." 
              : "Fill in the details to create a new contractor. A user account will be automatically created."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
        <ScrollArea className="max-h-[60vh] pr-4">
            {/* User Credentials (only for creation) */}
            {!contractor && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    User Credentials
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="********"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* General Info */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                General Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    placeholder="+1 234 567 8901"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skypeId">Skype ID</Label>
                  <Input
                    id="skypeId"
                    value={formData.skypeId}
                    onChange={(e) => setFormData({ ...formData, skypeId: e.target.value })}
                    placeholder="live:username"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="referredBy">Referred By</Label>
                  <Input
                    id="referredBy"
                    value={formData.referredBy}
                    onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                    placeholder="Name of the person who referred"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Address Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="officeBuilding">Office/Building</Label>
                  <Input
                    id="officeBuilding"
                    value={formData.officeBuilding}
                    onChange={(e) => setFormData({ ...formData, officeBuilding: e.target.value })}
                    placeholder="Building Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Input
                    id="address1"
                    value={formData.address1}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={formData.address2}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    placeholder="Apartment 4B"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryId">Country</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country: any) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Region</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postCode">Postal Code</Label>
                  <Input
                    id="postCode"
                    value={formData.postCode}
                    onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Relations & Status */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Relations & Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyId">Agency</Label>
                  <Select
                    value={formData.agencyId}
                    onValueChange={(value) => setFormData({ ...formData, agencyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No agency</SelectItem>
                      {agencies.map((agency: any) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboardingTemplateId">Onboarding Template</Label>
                  <Select
                    value={formData.onboardingTemplateId}
                    onValueChange={(value) => setFormData({ ...formData, onboardingTemplateId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No template</SelectItem>
                      {onboardingTemplates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {contractor ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{contractor ? "Update" : "Create"}</>
            )}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
