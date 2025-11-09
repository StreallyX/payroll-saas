"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/trpc"
import { toast } from "sonner"
import { Loader2, Building2, Mail, Phone, MapPin, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

type AgencyModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  agency?: any
  onSuccess?: () => void
}

export function AgencyModal({ open, onOpenChange, agency, onSuccess }: AgencyModalProps) {
  const [formData, setFormData] = useState({
    // Contact Details
    name: "",
    contactPhone: "",
    alternateContactPhone: "",
    contactEmail: "",
    primaryContactName: "",
    primaryContactJobTitle: "",
    fax: "",
    notes: "",
    
    // Address Details
    officeBuilding: "",
    address1: "",
    address2: "",
    city: "",
    countryId: "",
    state: "",
    postCode: "",
    
    // Invoice Details
    invoicingContactName: "",
    invoicingContactPhone: "",
    invoicingContactEmail: "",
    alternateInvoicingEmail: "",
    vatNumber: "",
    website: "",
    
    status: "active"
  })

  const utils = api.useUtils()
  const { data: countries } = api.country.getAll.useQuery()

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || "",
        contactPhone: agency.contactPhone || "",
        alternateContactPhone: agency.alternateContactPhone || "",
        contactEmail: agency.contactEmail || "",
        primaryContactName: agency.primaryContactName || "",
        primaryContactJobTitle: agency.primaryContactJobTitle || "",
        fax: agency.fax || "",
        notes: agency.notes || "",
        officeBuilding: agency.officeBuilding || "",
        address1: agency.address1 || "",
        address2: agency.address2 || "",
        city: agency.city || "",
        countryId: agency.countryId || "",
        state: agency.state || "",
        postCode: agency.postCode || "",
        invoicingContactName: agency.invoicingContactName || "",
        invoicingContactPhone: agency.invoicingContactPhone || "",
        invoicingContactEmail: agency.invoicingContactEmail || "",
        alternateInvoicingEmail: agency.alternateInvoicingEmail || "",
        vatNumber: agency.vatNumber || "",
        website: agency.website || "",
        status: agency.status || "active"
      })
    }
  }, [agency])

  const createMutation = api.agency.create.useMutation({
    onSuccess: () => {
      toast.success("Agency created successfully!")
      utils.agency.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create agency")
    }
  })

  const updateMutation = api.agency.update.useMutation({
    onSuccess: () => {
      toast.success("Agency updated successfully!")
      utils.agency.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update agency")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      contactPhone: "",
      alternateContactPhone: "",
      contactEmail: "",
      primaryContactName: "",
      primaryContactJobTitle: "",
      fax: "",
      notes: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.contactEmail) {
      toast.error("Veuillez remplir tous les champs requis")
      return
    }

    if (agency) {
      updateMutation.mutate({
        id: agency.id,
        ...formData,
        status: formData.status as "active" | "inactive" | "suspended"
      })
    } else {
      createMutation.mutate({
        ...formData,
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
            <Building2 className="w-5 h-5" />
            {agency ? "Edit Agency/Client" : "Add Agency/Client"}
          </DialogTitle>
          <DialogDescription>
            {agency ? "Modifiez les informations de l'agence/client" : "Remplissez les informations pour créer une nouvelle agence/client"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">
                    Agency/Client Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="alternateContactPhone">Alternate Phone Number</Label>
                  <Input
                    id="alternateContactPhone"
                    type="tel"
                    value={formData.alternateContactPhone}
                    onChange={(e) => setFormData({ ...formData, alternateContactPhone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">
                    Primary Contact E-mail <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="primaryContactName">Primary Contact Name</Label>
                  <Input
                    id="primaryContactName"
                    value={formData.primaryContactName}
                    onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="primaryContactJobTitle">Primary Contact Job Title</Label>
                  <Input
                    id="primaryContactJobTitle"
                    value={formData.primaryContactJobTitle}
                    onChange={(e) => setFormData({ ...formData, primaryContactJobTitle: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={formData.fax}
                    onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                Address Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="officeBuilding">Office/Building</Label>
                  <Input
                    id="officeBuilding"
                    value={formData.officeBuilding}
                    onChange={(e) => setFormData({ ...formData, officeBuilding: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address1">Address 1</Label>
                  <Input
                    id="address1"
                    value={formData.address1}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address2">Address 2</Label>
                  <Input
                    id="address2"
                    value={formData.address2}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="countryId">Country</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="state">State/County</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="postCode">Post Code/Zip Code</Label>
                  <Input
                    id="postCode"
                    value={formData.postCode}
                    onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Invoice Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoice Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoicingContactName">Invoicing Contact Name</Label>
                  <Input
                    id="invoicingContactName"
                    value={formData.invoicingContactName}
                    onChange={(e) => setFormData({ ...formData, invoicingContactName: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="invoicingContactPhone">Invoicing Contact Phone</Label>
                  <Input
                    id="invoicingContactPhone"
                    type="tel"
                    value={formData.invoicingContactPhone}
                    onChange={(e) => setFormData({ ...formData, invoicingContactPhone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="invoicingContactEmail">Invoicing Contact E-mail</Label>
                  <Input
                    id="invoicingContactEmail"
                    type="email"
                    value={formData.invoicingContactEmail}
                    onChange={(e) => setFormData({ ...formData, invoicingContactEmail: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="alternateInvoicingEmail">Alternate Invoicing E-mail</Label>
                  <Input
                    id="alternateInvoicingEmail"
                    type="email"
                    value={formData.alternateInvoicingEmail}
                    onChange={(e) => setFormData({ ...formData, alternateInvoicingEmail: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  />
                </div>

                <div>
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

            <Separator />

            {/* Status */}
            <div>
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
          </form>
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
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {agency ? "Mise à jour..." : "Création..."}
              </>
            ) : (
              <>{agency ? "Update" : "Create"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
