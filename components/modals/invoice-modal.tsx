
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

type InvoiceModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice?: {
    id: string
    contractId: string
    amount: number
    status: string
    invoiceRef?: string
    dueDate?: Date | string
  }
  onSuccess?: () => void
}

export function InvoiceModal({ open, onOpenChange, invoice, onSuccess }: InvoiceModalProps) {
  const [formData, setFormData] = useState({
    contractId: invoice?.contractId || "",
    amount: invoice?.amount?.toString() || "",
    status: invoice?.status || "draft",
    invoiceRef: invoice?.invoiceRef || "",
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ""
  })

  const utils = api.useUtils()

  // Fetch contracts for the dropdown
  const { data: contracts = [] } = api.contract.getAll.useQuery()

  useEffect(() => {
    if (invoice) {
      setFormData({
        contractId: invoice.contractId,
        amount: invoice.amount.toString(),
        status: invoice.status,
        invoiceRef: invoice.invoiceRef || "",
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ""
      })
    }
  }, [invoice])

  const createMutation = api.invoice.create.useMutation({
    onSuccess: () => {
      toast.success("Facture created successfully!")
      utils.invoice.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create de la facture")
    }
  })

  const updateMutation = api.invoice.update.useMutation({
    onSuccess: () => {
      toast.success("Facture updated successfully!")
      utils.invoice.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update de la facture")
    }
  })

  const resetForm = () => {
    setFormData({
      contractId: "",
      amount: "",
      status: "draft",
      invoiceRef: "",
      dueDate: ""
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      contractId: formData.contractId,
      amount: parseFloat(formData.amount),
      status: formData.status as "draft" | "sent" | "paid" | "overdue" | "cancelled",
      invoiceRef: formData.invoiceRef || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    }

    if (invoice) {
      updateMutation.mutate({
        id: invoice.id,
        ...payload
      })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Facture" : "New Facture"}</DialogTitle>
          <DialogDescription>
            {invoice ? "Mettez à jour les informations de la facture." : "Remplissez les détails pour créer une nouvelle facture."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contractId">Contrat *</Label>
            <Select value={formData.contractId} onValueChange={(value) => setFormData({ ...formData, contractId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select un contrat" />
              </SelectTrigger>
              <SelectContent>
                {contracts.length === 0 ? (
                  <SelectItem value="none" disabled>Aucun contrat disponible</SelectItem>
                ) : (
                  contracts.map((contract: any) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.title || `Contrat ${contract.id.slice(0, 8)}`} - {contract.contractor?.user?.name || 'Unknown'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="1500.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceRef">Référence</Label>
              <Input
                id="invoiceRef"
                value={formData.invoiceRef}
                onChange={(e) => setFormData({ ...formData, invoiceRef: e.target.value })}
                placeholder="INV-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d'Échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.contractId || !formData.amount}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {invoice ? "Mettre à Jour" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
