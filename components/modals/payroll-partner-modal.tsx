
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
import { Loader2 } from "lucide-react"

type PayrollPartnerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner?: {
    id: string
    name: string
    contactEmail: string
    contactPhone?: string
    address?: string
    status: string
  }
  onSuccess?: (partner?: any) => void
}

export function PayrollPartnerModal({ open, onOpenChange, partner, onSuccess }: PayrollPartnerModalProps) {
  const [formData, setFormData] = useState({
    name: partner?.name || "",
    contactEmail: partner?.contactEmail || "",
    contactPhone: partner?.contactPhone || "",
    address: partner?.address || "",
    status: partner?.status || "active"
  })

  const utils = api.useUtils()

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        contactEmail: partner.contactEmail,
        contactPhone: partner.contactPhone || "",
        address: partner.address || "",
        status: partner.status
      })
    }
  }, [partner])

  const createMutation = api.payroll.create.useMutation({
    onSuccess: (data) => {
      toast.success("Partenaire de paie created successfully!")
      utils.payroll.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.(data)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create du partenaire")
    }
  })

  const updateMutation = api.payroll.update.useMutation({
    onSuccess: () => {
      toast.success("Partenaire de paie updated successfully!")
      utils.payroll.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update du partenaire")
    }
  })

  const resetForm = () => {
    setFormData({
      name: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      status: "active"
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (partner) {
      updateMutation.mutate({
        id: partner.id,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partner ? "Edit Partenaire de Paie" : "New Partenaire de Paie"}</DialogTitle>
          <DialogDescription>
            {partner ? "Mettez à jour les informations du partenaire." : "Remplissez les détails pour créer un nouveau partenaire de paie."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du Partenaire *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Global Payroll Services"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de Contact *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@payroll.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Téléphone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Rue du Partenaire, 75001 Paris"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {partner ? "Mettre à Jour" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
