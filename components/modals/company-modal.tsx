

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type CompanyModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: any
  onSuccess?: () => void
}

export function CompanyModal({ open, onOpenChange, company, onSuccess }: CompanyModalProps) {
  const [formData, setFormData] = useState({
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
    status: company?.status || "active"
  })

  const utils = api.useUtils()
  const { data: countries = [] } = api.country.getAll.useQuery()

  const createMutation = api.company.create.useMutation({
    onSuccess: () => {
      toast.success("Organization created successfully!")
      utils.company.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create organization")
    }
  })

  const updateMutation = api.company.update.useMutation({
    onSuccess: () => {
      toast.success("Organization updated successfully!")
      utils.company.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update organization")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      officeBuilding: "",
      address1: "",
      address2: "",
      city: "",
      countryId: "",
      state: "",
      postCode: "",
      invoicingContactName: "",
      invoicingContactPhone: "",
      invoicingContactEmail: "",
      alternateInvoicingEmail: "",
      vatNumber: "",
      website: "",
      status: "active"
    })
  }

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        contactPerson: company.contactPerson || "",
        contactEmail: company.contactEmail || "",
        contactPhone: company.contactPhone || "",
        officeBuilding: company.officeBuilding || "",
        address1: company.address1 || "",
        address2: company.address2 || "",
        city: company.city || "",
        countryId: company.countryId || "",
        state: company.state || "",
        postCode: company.postCode || "",
        invoicingContactName: company.invoicingContactName || "",
        invoicingContactPhone: company.invoicingContactPhone || "",
        invoicingContactEmail: company.invoicingContactEmail || "",
        alternateInvoicingEmail: company.alternateInvoicingEmail || "",
        vatNumber: company.vatNumber || "",
        website: company.website || "",
        status: company.status || "active"
      })
    }
  }, [company])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (company) {
      updateMutation.mutate({ id: company.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Organization" : "Add Organization"}</DialogTitle>
          <DialogDescription>
            {company ? "Update organization information." : "Fill in the details to add a new organization."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Organization Name"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="Email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Phone Number"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Address Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="officeBuilding">Office#/Building</Label>
                <Input
                  id="officeBuilding"
                  value={formData.officeBuilding}
                  onChange={(e) => setFormData({ ...formData, officeBuilding: e.target.value })}
                  placeholder="Office#/Building"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address1">Address 1</Label>
                <Input
                  id="address1"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  placeholder="Address 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Address 2</Label>
                <Input
                  id="address2"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  placeholder="Address 2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="countryId">Country</Label>
                <Select value={formData.countryId} onValueChange={(value) => setFormData({ ...formData, countryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.length === 0 ? (
                      <SelectItem value="none-disabled" disabled>No countries available</SelectItem>
                    ) : (
                      countries.map((country: any) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/County</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postCode">Post Code/Zip Code</Label>
                <Input
                  id="postCode"
                  value={formData.postCode}
                  onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                  placeholder="Post Code"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Invoice Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicingContactName">Invoicing Contact Name</Label>
                <Input
                  id="invoicingContactName"
                  value={formData.invoicingContactName}
                  onChange={(e) => setFormData({ ...formData, invoicingContactName: e.target.value })}
                  placeholder="Invoicing Contact Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoicingContactPhone">Invoicing Contact Phone</Label>
                <Input
                  id="invoicingContactPhone"
                  value={formData.invoicingContactPhone}
                  onChange={(e) => setFormData({ ...formData, invoicingContactPhone: e.target.value })}
                  placeholder="Invoicing Contact Phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoicingContactEmail">Invoicing Contact E-mail</Label>
                <Input
                  id="invoicingContactEmail"
                  type="email"
                  value={formData.invoicingContactEmail}
                  onChange={(e) => setFormData({ ...formData, invoicingContactEmail: e.target.value })}
                  placeholder="Invoicing Contact E-mail"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternateInvoicingEmail">Alternate Invoicing E-mail</Label>
                <Input
                  id="alternateInvoicingEmail"
                  type="email"
                  value={formData.alternateInvoicingEmail}
                  onChange={(e) => setFormData({ ...formData, alternateInvoicingEmail: e.target.value })}
                  placeholder="Alternate E-mail"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  placeholder="VAT Number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {company ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
